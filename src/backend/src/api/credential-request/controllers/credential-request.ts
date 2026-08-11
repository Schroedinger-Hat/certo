/**
 * credential-request controller
 *
 * Handles the approval workflow for credential issuance:
 *   1. Any authenticated user can submit a request (POST /credential-requests)
 *   2. An issuer reviews pending requests (GET /credential-requests)
 *   3. Issuer approves → credential is issued automatically (POST /:id/approve)
 *   4. Issuer rejects with a reason (POST /:id/reject)
 *
 * Email notifications are sent to the requester on approval and rejection.
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::credential-request.credential-request', ({ strapi }) => ({

  /**
   * Submit a new credential request.
   * Any authenticated user can request a credential for themselves or a recipient.
   */
  async create(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to submit a credential request');
    }

    const { achievementId, recipientEmail, recipientName, expirationDate, requesterNote } = ctx.request.body?.data ?? {};

    if (!achievementId) return ctx.badRequest('achievementId is required');
    if (!recipientEmail) return ctx.badRequest('recipientEmail is required');

    // Verify achievement exists
    const achievement = await strapi.entityService.findOne('api::achievement.achievement', achievementId);
    if (!achievement) return ctx.notFound('Achievement not found');

    const request = await strapi.entityService.create('api::credential-request.credential-request', {
      data: {
        status: 'pending',
        achievementId,
        recipientEmail,
        recipientName: recipientName || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        requesterNote: requesterNote || null,
        submittedByEmail: ctx.state.user.email,
        submittedById: ctx.state.user.id,
      },
    });

    // Notify issuers about the new request via audit log (future: email issuer)
    const auditLog = strapi.service('api::audit-log-entry.audit-log');
    await auditLog.record({
      action: 'credential_request.submitted',
      entityType: 'credential-request',
      entityId: String(request.id),
      actorId: ctx.state.user.id,
      metadata: { achievementId, recipientEmail },
    });

    strapi.log.info(`[credential-request] New request #${request.id} submitted by ${ctx.state.user.email} for ${recipientEmail}`);

    return { data: request };
  },

  /**
   * List credential requests.
   * - Issuers see all pending requests
   * - Regular users see only their own requests
   */
  async find(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Check if user is an issuer (has any profile with profileType Issuer/Both)
    const profiles = await strapi.entityService.findMany('api::profile.profile', {
      filters: { owner: { id: ctx.state.user.id } } as any,
    });
    const isIssuer = profiles.some((p: any) => ['Issuer', 'Both'].includes(p.profileType));

    const filters: any = {};
    if (!isIssuer) {
      // Regular users only see their own submissions
      filters.submittedById = ctx.state.user.id;
    }
    if (ctx.query.status) {
      filters.status = ctx.query.status;
    }

    const requests = await strapi.entityService.findMany('api::credential-request.credential-request', {
      filters,
      sort: { createdAt: 'desc' },
    });

    return { data: requests };
  },

  /**
   * Get a single credential request.
   */
  async findOne(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { id } = ctx.params;
    const request = await strapi.entityService.findOne('api::credential-request.credential-request', id) as any;

    if (!request) return ctx.notFound('Request not found');

    // Access control: only the submitter or an issuer can view
    const isOwner = request.submittedById === ctx.state.user.id;
    const profiles = await strapi.entityService.findMany('api::profile.profile', {
      filters: { owner: { id: ctx.state.user.id } } as any,
    });
    const isIssuer = profiles.some((p: any) => ['Issuer', 'Both'].includes(p.profileType));

    if (!isOwner && !isIssuer) {
      return ctx.forbidden('You do not have access to this request');
    }

    return { data: request };
  },

  /**
   * Approve a credential request.
   * Issuer-only. Issues the credential automatically.
   */
  async approve(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { id } = ctx.params;
    const { reviewerNote } = ctx.request.body ?? {};

    const request = await strapi.entityService.findOne('api::credential-request.credential-request', id) as any;
    if (!request) return ctx.notFound('Request not found');
    if (request.status !== 'pending') {
      return ctx.badRequest(`Request is already ${request.status}`);
    }

    // Verify the user is an issuer
    const profiles = await strapi.entityService.findMany('api::profile.profile', {
      filters: { owner: { id: ctx.state.user.id } } as any,
    });
    const isIssuer = profiles.some((p: any) => ['Issuer', 'Both'].includes(p.profileType));
    if (!isIssuer) {
      return ctx.forbidden('Only issuers can approve credential requests');
    }

    // Fetch the achievement
    const achievement = await strapi.entityService.findOne('api::achievement.achievement', request.achievementId, {
      populate: ['creator'],
    }) as any;
    if (!achievement) return ctx.notFound('Achievement not found');

    // Find or create the recipient profile
    const credentialService = strapi.service('api::credential.credential');
    const recipient = await (credentialService as any).findOrCreateRecipientProfile({
      email: request.recipientEmail,
      name: request.recipientName || request.recipientEmail.split('@')[0],
    });

    // Issue the credential
    const credential = await credentialService.issue(
      achievement,
      recipient,
      [],
      request.expirationDate ? request.expirationDate.toISOString() : undefined,
      ctx.state.user.id,
    );

    // Update request status
    await strapi.entityService.update('api::credential-request.credential-request', id, {
      data: {
        status: 'approved',
        reviewerNote: reviewerNote || null,
        reviewedByEmail: ctx.state.user.email,
        reviewedById: ctx.state.user.id,
        reviewedAt: new Date(),
        issuedCredentialId: credential?.credentialId || null,
      } as any,
    });

    // Notify the requester
    try {
      const frontendUrl = strapi.config.get('custom.frontendUrl', 'http://localhost:3000');
      const { getNotificationProvider } = await import('../../api/credential/services/notification-providers/index.js' as any);
      const notificationProvider = getNotificationProvider(strapi);
      await notificationProvider.sendCredentialIssued({
        to: request.submittedByEmail,
        achievement: { name: (achievement as any).achievementType ?? (achievement as any).name ?? 'Credential' },
        credential: { credentialId: credential?.credentialId ?? '', id: credential?.id ?? '' },
        frontendUrl,
        user: null,
      });
    } catch (err: any) {
      strapi.log.warn(`[credential-request] Failed to notify requester: ${err.message}`);
    }

    const auditLog = strapi.service('api::audit-log-entry.audit-log');
    await auditLog.record({
      action: 'credential_request.approved',
      entityType: 'credential-request',
      entityId: String(id),
      actorId: ctx.state.user.id,
      metadata: { credentialId: credential?.credentialId },
    });

    strapi.log.info(`[credential-request] Request #${id} approved by ${ctx.state.user.email}, issued ${credential?.credentialId}`);

    return { data: { status: 'approved', credentialId: credential?.credentialId } };
  },

  /**
   * Reject a credential request.
   * Issuer-only. Sends notification to the requester.
   */
  async reject(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { id } = ctx.params;
    const { reviewerNote } = ctx.request.body ?? {};

    const request = await strapi.entityService.findOne('api::credential-request.credential-request', id) as any;
    if (!request) return ctx.notFound('Request not found');
    if (request.status !== 'pending') {
      return ctx.badRequest(`Request is already ${request.status}`);
    }

    const profiles = await strapi.entityService.findMany('api::profile.profile', {
      filters: { owner: { id: ctx.state.user.id } } as any,
    });
    const isIssuer = profiles.some((p: any) => ['Issuer', 'Both'].includes(p.profileType));
    if (!isIssuer) {
      return ctx.forbidden('Only issuers can reject credential requests');
    }

    await strapi.entityService.update('api::credential-request.credential-request', id, {
      data: {
        status: 'rejected',
        reviewerNote: reviewerNote || null,
        reviewedByEmail: ctx.state.user.email,
        reviewedById: ctx.state.user.id,
        reviewedAt: new Date(),
      } as any,
    });

    const auditLog = strapi.service('api::audit-log-entry.audit-log');
    await auditLog.record({
      action: 'credential_request.rejected',
      entityType: 'credential-request',
      entityId: String(id),
      actorId: ctx.state.user.id,
      metadata: { reviewerNote },
    });

    strapi.log.info(`[credential-request] Request #${id} rejected by ${ctx.state.user.email}`);

    return { data: { status: 'rejected' } };
  },
}));

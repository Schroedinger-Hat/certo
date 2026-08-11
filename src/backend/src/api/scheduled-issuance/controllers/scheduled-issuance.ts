/**
 * scheduled-issuance controller
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::scheduled-issuance.scheduled-issuance' as any, ({ strapi }) => ({

  /**
   * Schedule a credential for future issuance.
   */
  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('You must be logged in');

    const { achievementId, recipientEmail, recipientName, scheduledDate, expirationDate, note } = ctx.request.body?.data ?? {};

    if (!achievementId) return ctx.badRequest('achievementId is required');
    if (!recipientEmail) return ctx.badRequest('recipientEmail is required');
    if (!scheduledDate) return ctx.badRequest('scheduledDate is required');

    const parsed = new Date(scheduledDate);
    if (isNaN(parsed.getTime())) return ctx.badRequest('scheduledDate must be a valid date');
    if (parsed <= new Date()) return ctx.badRequest('scheduledDate must be in the future');

    const achievement = await strapi.entityService.findOne('api::achievement.achievement', achievementId);
    if (!achievement) return ctx.notFound('Achievement not found');

    const item = await strapi.entityService.create('api::scheduled-issuance.scheduled-issuance' as any, {
      data: {
        status: 'pending',
        achievementId,
        recipientEmail,
        recipientName: recipientName ?? null,
        scheduledDate: parsed,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        note: note ?? null,
        scheduledById: ctx.state.user.id,
        scheduledByEmail: ctx.state.user.email,
      } as any,
    });

    strapi.log.info(`[scheduled-issuance] Scheduled #${item.id} for ${recipientEmail} on ${parsed.toISOString()}`);
    return { data: item };
  },

  /**
   * List scheduled issuances. Issuers see all; others see their own.
   */
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('You must be logged in');

    const profiles = await strapi.entityService.findMany('api::profile.profile', {
      filters: { owner: { id: ctx.state.user.id } } as any,
    });
    const isIssuer = (profiles as any[]).some((p: any) => ['Issuer', 'Both'].includes(p.profileType));

    const filters: any = {};
    if (!isIssuer) filters.scheduledById = ctx.state.user.id;
    if (ctx.query.status) filters.status = ctx.query.status;

    const items = await strapi.entityService.findMany('api::scheduled-issuance.scheduled-issuance' as any, {
      filters,
      sort: { scheduledDate: 'asc' },
    });

    return { data: items };
  },

  /**
   * Cancel a pending scheduled issuance.
   */
  async cancel(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const { cancelReason } = ctx.request.body ?? {};

    const item = await strapi.entityService.findOne('api::scheduled-issuance.scheduled-issuance' as any, id) as any;
    if (!item) return ctx.notFound('Scheduled issuance not found');
    if (item.status !== 'pending') return ctx.badRequest(`Cannot cancel — status is already '${item.status}'`);

    // Owner or issuer can cancel
    if (item.scheduledById !== ctx.state.user.id) {
      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { owner: { id: ctx.state.user.id } } as any,
      });
      const isIssuer = (profiles as any[]).some((p: any) => ['Issuer', 'Both'].includes(p.profileType));
      if (!isIssuer) return ctx.forbidden('You can only cancel your own scheduled issuances');
    }

    await strapi.entityService.update('api::scheduled-issuance.scheduled-issuance' as any, id, {
      data: { status: 'cancelled', cancelReason: cancelReason ?? null } as any,
    });

    return { data: { status: 'cancelled' } };
  },

  /**
   * Manually trigger the scheduled-issuance daily check (admin/issuer only).
   */
  async runCheck(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('You must be logged in');

    const scanner = strapi.service('api::scheduled-issuance.scheduled-issuance-scanner');
    const result = await scanner.runDailyCheck();
    return { data: result };
  },
}));

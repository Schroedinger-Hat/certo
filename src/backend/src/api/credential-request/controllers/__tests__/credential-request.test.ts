/**
 * Tests for the credential-request controller (approval workflow)
 */

// Mock @strapi/strapi so createCoreController just returns the inner factory
jest.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (_name: string, factory: (deps: { strapi: any }) => any) => factory,
  },
}));

describe('credential-request controller', () => {
  // ── Shared mock helpers ─────────────────────────────────────────────────

  function makeMockStrapi(overrides: Record<string, any> = {}) {
    return {
      entityService: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findOne: jest.fn(),
        update: jest.fn(),
      },
      service: jest.fn().mockReturnValue({
        record: jest.fn(),
        issue: jest.fn().mockResolvedValue({ id: 99, credentialId: 'urn:uuid:issued' }),
        findOrCreateRecipientProfile: jest.fn().mockResolvedValue({ id: 5, email: 'recipient@example.com' }),
      }),
      config: { get: jest.fn().mockReturnValue('http://localhost:3000') },
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      ...overrides,
    } as any;
  }

  function makeMockCtx(overrides: Record<string, any> = {}) {
    return {
      state: { user: { id: 1, email: 'user@example.com' } },
      request: { body: { data: {} } },
      params: {},
      query: {},
      unauthorized: jest.fn((msg?: string) => ({ error: msg })),
      forbidden: jest.fn((msg?: string) => ({ error: msg })),
      badRequest: jest.fn((msg?: string) => ({ error: msg })),
      notFound: jest.fn((msg?: string) => ({ error: msg })),
      ...overrides,
    } as any;
  }

  // ── create ───────────────────────────────────────────────────────────────

  describe('create (submit request)', () => {
    it('should return unauthorized when not logged in', async () => {
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi();
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ state: { user: null } });

      await controller.create(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith(expect.stringContaining('logged in'));
    });

    it('should return badRequest when achievementId is missing', async () => {
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi();
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ request: { body: { data: { recipientEmail: 'a@b.com' } } } });

      await controller.create(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('achievementId is required');
    });

    it('should return notFound when achievement does not exist', async () => {
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi({
        entityService: { findOne: jest.fn().mockResolvedValue(null), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      });
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ request: { body: { data: { achievementId: 99, recipientEmail: 'a@b.com' } } } });

      await controller.create(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('Achievement not found');
    });

    it('should create request and return it on success', async () => {
      const mockAchievement = { id: 1, achievementType: 'Test Badge' };
      const mockRequest = { id: 42, status: 'pending', achievementId: 1, recipientEmail: 'a@b.com' };
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi({
        entityService: {
          findOne: jest.fn().mockResolvedValue(mockAchievement),
          create: jest.fn().mockResolvedValue(mockRequest),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn(),
        },
      });
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ request: { body: { data: { achievementId: 1, recipientEmail: 'a@b.com' } } } });

      const result = await controller.create(ctx);

      expect(strapi.entityService.create).toHaveBeenCalledWith(
        'api::credential-request.credential-request',
        expect.objectContaining({ data: expect.objectContaining({ status: 'pending', recipientEmail: 'a@b.com' }) }),
      );
      expect(result).toEqual({ data: mockRequest });
    });
  });

  // ── approve ──────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('should return forbidden when user is not an issuer', async () => {
      const mockRequest = { id: 1, status: 'pending', achievementId: 1, recipientEmail: 'a@b.com' };
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi({
        entityService: {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          findMany: jest.fn().mockResolvedValue([]), // no issuer profiles
          create: jest.fn(),
          update: jest.fn(),
        },
      });
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ params: { id: '1' }, request: { body: {} } });

      await controller.approve(ctx);

      expect(ctx.forbidden).toHaveBeenCalledWith(expect.stringContaining('issuers'));
    });

    it('should return badRequest when request is already approved', async () => {
      const mockRequest = { id: 1, status: 'approved' };
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi({
        entityService: { findOne: jest.fn().mockResolvedValue(mockRequest), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      });
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ params: { id: '1' }, request: { body: {} } });

      await controller.approve(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('already approved'));
    });

    it('should approve, issue credential, and return credentialId', async () => {
      const mockRequest = { id: 1, status: 'pending', achievementId: 1, recipientEmail: 'a@b.com', submittedByEmail: 'user@example.com' };
      const mockAchievement = { id: 1, achievementType: 'Test Badge', creator: { id: 2 } };
      const mockIssued = { id: 99, credentialId: 'urn:uuid:new-cred' };
      const mockRecipient = { id: 5, email: 'a@b.com' };

      const mockCredentialService = {
        issue: jest.fn().mockResolvedValue(mockIssued),
        findOrCreateRecipientProfile: jest.fn().mockResolvedValue(mockRecipient),
      };

      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi({
        entityService: {
          findOne: jest.fn()
            .mockResolvedValueOnce(mockRequest)     // for the request
            .mockResolvedValueOnce(mockAchievement), // for the achievement
          findMany: jest.fn().mockResolvedValue([{ id: 10, profileType: 'Issuer' }]), // issuer profile
          create: jest.fn(),
          update: jest.fn().mockResolvedValue({}),
        },
        service: jest.fn((name: string) => {
          if (name === 'api::credential.credential') return mockCredentialService;
          return { record: jest.fn() };
        }),
      });

      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ params: { id: '1' }, request: { body: { reviewerNote: 'Looks good' } } });

      const result = await controller.approve(ctx);

      expect(mockCredentialService.issue).toHaveBeenCalled();
      expect(strapi.entityService.update).toHaveBeenCalledWith(
        'api::credential-request.credential-request',
        '1',
        expect.objectContaining({ data: expect.objectContaining({ status: 'approved' }) }),
      );
      expect(result).toEqual({ data: { status: 'approved', credentialId: 'urn:uuid:new-cred' } });
    });
  });

  // ── reject ───────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('should reject pending request and return status', async () => {
      const mockRequest = { id: 1, status: 'pending', recipientEmail: 'a@b.com' };
      const { default: controllerFactory } = await import('../credential-request');
      const strapi = makeMockStrapi({
        entityService: {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          findMany: jest.fn().mockResolvedValue([{ id: 10, profileType: 'Issuer' }]),
          create: jest.fn(),
          update: jest.fn().mockResolvedValue({}),
        },
      });
      const controller = (controllerFactory as any)({ strapi });
      const ctx = makeMockCtx({ params: { id: '1' }, request: { body: { reviewerNote: 'Not eligible' } } });

      const result = await controller.reject(ctx);

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        'api::credential-request.credential-request',
        '1',
        expect.objectContaining({ data: expect.objectContaining({ status: 'rejected' }) }),
      );
      expect(result).toEqual({ data: { status: 'rejected' } });
    });
  });
});

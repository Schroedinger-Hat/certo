import multiTenancyFactory from '../multi-tenancy';

describe('Multi-Tenancy Service', () => {
  let service: ReturnType<typeof multiTenancyFactory>;

  beforeEach(() => {
    // Mock strapi service
    global.strapi = {
      entityService: {
        findMany: jest.fn(),
        findOne: jest.fn(),
      },
    } as any;

    service = multiTenancyFactory();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfiles', () => {
    it('should return profiles owned by a user', async () => {
      const mockProfiles = [
        { id: 1, name: 'Profile 1', owner: { id: 123 } },
        { id: 2, name: 'Profile 2', owner: { id: 123 } },
      ];

      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue(mockProfiles);

      const result = await service.getUserProfiles(123);

      expect(global.strapi.entityService.findMany).toHaveBeenCalledWith(
        'api::profile.profile',
        {
          filters: {
            $or: [
              { owner: { id: 123 } },
              { owner: null },
            ],
          },
        }
      );
      expect(result).toEqual(mockProfiles);
    });

    it('should also return profiles with no owner (backward compatibility)', async () => {
      const mockProfiles = [
        { id: 1, name: 'Legacy Profile', owner: null },
        { id: 2, name: 'Owned Profile', owner: { id: 123 } },
      ];

      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue(mockProfiles);

      const result = await service.getUserProfiles(123);

      expect(result).toEqual(mockProfiles);
    });

    it('should return empty array if user has no profiles', async () => {
      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserProfiles(999);

      expect(result).toEqual([]);
    });
  });

  describe('userOwnsProfile', () => {
    it('should return true if user owns the profile', async () => {
      const mockProfile = { id: 1, name: 'Profile 1', owner: { id: 123 } };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockProfile);

      const result = await service.userOwnsProfile(123, 1);

      expect(result).toBe(true);
    });

    it('should return false if user does not own the profile', async () => {
      const mockProfile = { id: 1, name: 'Profile 1', owner: { id: 456 } };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockProfile);

      const result = await service.userOwnsProfile(123, 1);

      expect(result).toBe(false);
    });

    it('should return false if profile does not exist', async () => {
      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.userOwnsProfile(123, 999);

      expect(result).toBe(false);
    });

    it('should return true for a profile with no owner (legacy resource)', async () => {
      const mockProfile = { id: 1, name: 'Legacy Profile', owner: null };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockProfile);

      const result = await service.userOwnsProfile(123, 1);

      expect(result).toBe(true);
    });
  });

  describe('userCanAccessCredential', () => {
    it('should return true if user owns issuer profile', async () => {
      const mockCredential = {
        id: 1,
        credentialId: 'urn:uuid:123',
        issuer: { id: 1, owner: { id: 123 } },
        recipient: { id: 2, owner: { id: 456 } },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockCredential);

      const result = await service.userCanAccessCredential(123, 1);

      expect(result).toBe(true);
    });

    it('should return true if user owns recipient profile', async () => {
      const mockCredential = {
        id: 1,
        credentialId: 'urn:uuid:123',
        issuer: { id: 1, owner: { id: 456 } },
        recipient: { id: 2, owner: { id: 123 } },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockCredential);

      const result = await service.userCanAccessCredential(123, 1);

      expect(result).toBe(true);
    });

    it('should return false if user does not own either profile', async () => {
      const mockCredential = {
        id: 1,
        credentialId: 'urn:uuid:123',
        issuer: { id: 1, owner: { id: 456 } },
        recipient: { id: 2, owner: { id: 789 } },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockCredential);

      const result = await service.userCanAccessCredential(123, 1);

      expect(result).toBe(false);
    });

    it('should return false if credential does not exist', async () => {
      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.userCanAccessCredential(123, 999);

      expect(result).toBe(false);
    });

    it('should return true if issuer profile has no owner (legacy resource)', async () => {
      const mockCredential = {
        id: 1,
        credentialId: 'urn:uuid:legacy',
        issuer: { id: 1, owner: null },
        recipient: { id: 2, owner: { id: 456 } },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockCredential);

      const result = await service.userCanAccessCredential(123, 1);

      expect(result).toBe(true);
    });

    it('should return true if recipient profile has no owner (legacy resource)', async () => {
      const mockCredential = {
        id: 1,
        credentialId: 'urn:uuid:legacy',
        issuer: { id: 1, owner: { id: 456 } },
        recipient: { id: 2, owner: null },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockCredential);

      const result = await service.userCanAccessCredential(123, 1);

      expect(result).toBe(true);
    });
  });

  describe('userCanAccessAchievement', () => {
    it('should return true if user owns creator profile', async () => {
      const mockAchievement = {
        id: 1,
        name: 'Achievement 1',
        creator: { id: 1, owner: { id: 123 } },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await service.userCanAccessAchievement(123, 1);

      expect(result).toBe(true);
    });

    it('should return false if user does not own creator profile', async () => {
      const mockAchievement = {
        id: 1,
        name: 'Achievement 1',
        creator: { id: 1, owner: { id: 456 } },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await service.userCanAccessAchievement(123, 1);

      expect(result).toBe(false);
    });

    it('should return false if achievement does not exist', async () => {
      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.userCanAccessAchievement(123, 999);

      expect(result).toBe(false);
    });

    it('should return true if creator profile has no owner (legacy resource)', async () => {
      const mockAchievement = {
        id: 1,
        name: 'Legacy Achievement',
        creator: { id: 1, owner: null },
      };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await service.userCanAccessAchievement(123, 1);

      expect(result).toBe(true);
    });
  });

  describe('getUserCredentials', () => {
    it('should return credentials where user owns issuer profile', async () => {
      const mockProfileIds = [1];
      const mockCredentials = [
        {
          id: 1,
          credentialId: 'urn:uuid:123',
          issuer: { id: 1 },
          recipient: { id: 2 },
        },
      ];

      (global.strapi.entityService.findMany as jest.Mock)
        .mockResolvedValueOnce(mockProfileIds)
        .mockResolvedValueOnce(mockCredentials);

      const result = await service.getUserCredentials(123);

      expect(result).toEqual(mockCredentials);
    });
  });

  describe('getUserEvidence', () => {
    it('should return evidence for user credentials', async () => {
      const mockCredentials = [{ id: 1 }, { id: 2 }];
      const mockEvidence = [
        { id: 1, credential: { id: 1 } },
        { id: 2, credential: { id: 2 } },
      ];

      (global.strapi.entityService.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockCredentials)
        .mockResolvedValueOnce(mockEvidence);

      const result = await service.getUserEvidence(123);

      expect(result).toEqual(mockEvidence);
    });

    it('should return empty array if user has no credentials', async () => {
      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.getUserEvidence(123);

      expect(result).toEqual([]);
    });
  });
});

import scannerFactory from '../scheduled-issuance-scanner';

describe('ScheduledIssuanceScanner', () => {
  let scanner: ReturnType<typeof scannerFactory>;

  beforeEach(() => {
    global.strapi = {
      entityService: {
        findMany: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
      },
      service: jest.fn().mockReturnValue({
        issue: jest.fn().mockResolvedValue({ id: 10, credentialId: 'urn:uuid:issued-1' }),
        findOrCreateRecipientProfile: jest.fn().mockResolvedValue({ id: 5, email: 'r@example.com' }),
        record: jest.fn(),
      }),
      log: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
    } as any;

    scanner = scannerFactory();
  });

  afterEach(() => jest.clearAllMocks());

  describe('findDue', () => {
    it('should query pending issuances with scheduledDate <= now', async () => {
      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([]);
      await scanner.findDue();
      expect(global.strapi.entityService.findMany).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          filters: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });

    it('should return matching items', async () => {
      const mockItems = [{ id: 1, achievementId: 1, recipientEmail: 'a@b.com', scheduledDate: new Date() }];
      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue(mockItems);
      const result = await scanner.findDue();
      expect(result).toEqual(mockItems);
    });
  });

  describe('processOne', () => {
    it('should mark as failed when achievement not found', async () => {
      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(null);
      const item = { id: 1, achievementId: 99, recipientEmail: 'a@b.com' };
      const result = await scanner.processOne(item);
      expect(result).toBe(false);
      expect(global.strapi.entityService.update).toHaveBeenCalledWith(
        expect.anything(), 1,
        expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
      );
    });

    it('should issue credential and mark as issued when achievement exists', async () => {
      const mockAchievement = { id: 1, achievementType: 'Test Badge', creator: { id: 2 } };
      const mockIssued = { id: 10, credentialId: 'urn:uuid:issued-1' };
      const mockRecipient = { id: 5, email: 'a@b.com' };

      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue(mockAchievement);
      const mockCredService = {
        issue: jest.fn().mockResolvedValue(mockIssued),
        findOrCreateRecipientProfile: jest.fn().mockResolvedValue(mockRecipient),
      };
      (global.strapi.service as jest.Mock).mockImplementation((name: string) => {
        if (name === 'api::credential.credential') return mockCredService;
        return { record: jest.fn() };
      });

      const item = { id: 1, achievementId: 1, recipientEmail: 'a@b.com', scheduledById: 7 };
      const result = await scanner.processOne(item);

      expect(result).toBe(true);
      expect(mockCredService.issue).toHaveBeenCalled();
      expect(global.strapi.entityService.update).toHaveBeenCalledWith(
        expect.anything(), 1,
        expect.objectContaining({ data: expect.objectContaining({ status: 'issued', issuedCredentialId: 'urn:uuid:issued-1' }) }),
      );
    });

    it('should mark as failed and log error when issue throws', async () => {
      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      const mockCredService = {
        issue: jest.fn().mockRejectedValue(new Error('signing key missing')),
        findOrCreateRecipientProfile: jest.fn().mockResolvedValue({ id: 5 }),
      };
      (global.strapi.service as jest.Mock).mockReturnValue(mockCredService);

      const item = { id: 2, achievementId: 1, recipientEmail: 'b@b.com' };
      const result = await scanner.processOne(item);

      expect(result).toBe(false);
      expect(global.strapi.entityService.update).toHaveBeenCalledWith(
        expect.anything(), 2,
        expect.objectContaining({ data: expect.objectContaining({ status: 'failed', failureReason: 'signing key missing' }) }),
      );
    });
  });

  describe('runDailyCheck', () => {
    it('should return zero counts when nothing is due', async () => {
      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([]);
      const result = await scanner.runDailyCheck();
      expect(result).toEqual({ processed: 0, issued: 0, failed: 0 });
    });

    it('should process all due items and tally results', async () => {
      const dueItems = [
        { id: 1, achievementId: 1, recipientEmail: 'a@b.com' },
        { id: 2, achievementId: 1, recipientEmail: 'b@b.com' },
      ];
      (global.strapi.entityService.findMany as jest.Mock).mockResolvedValue(dueItems);
      (global.strapi.entityService.findOne as jest.Mock).mockResolvedValue({ id: 1, achievementType: 'Badge' });
      const mockCredService = {
        issue: jest.fn().mockResolvedValue({ id: 10, credentialId: 'urn:uuid:x' }),
        findOrCreateRecipientProfile: jest.fn().mockResolvedValue({ id: 5 }),
      };
      (global.strapi.service as jest.Mock).mockImplementation(() => ({
        ...mockCredService,
        record: jest.fn(),
      }));

      const result = await scanner.runDailyCheck();

      expect(result.processed).toBe(2);
      expect(result.issued).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});

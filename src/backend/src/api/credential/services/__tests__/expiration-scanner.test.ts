import expirationScannerFactory from '../expiration-scanner'

describe('ExpirationScanner Service', () => {
  let service: ReturnType<typeof expirationScannerFactory>

  beforeEach(() => {
    global.strapi = {
      entityService: {
        findMany: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
      },
      config: {
        get: jest.fn((key: string, def: any) => def),
      },
      log: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      },
      plugins: {
        email: {
          services: {
            email: { send: jest.fn() },
          },
        },
      },
    } as any

    service = expirationScannerFactory()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findExpiringSoon', () => {
    it('should query credentials expiring within N days', async () => {
      const mockCredentials = [
        { id: 1, credentialId: 'urn:uuid:abc', expirationDate: new Date(Date.now() + 5 * 86400000) },
      ]
      ;(global.strapi.entityService.findMany as jest.Mock).mockResolvedValue(mockCredentials)

      const result = await service.findExpiringSoon(7)

      expect(global.strapi.entityService.findMany).toHaveBeenCalledWith(
        'api::credential.credential',
        expect.objectContaining({
          filters: expect.objectContaining({
            expirationDate: expect.objectContaining({ $gte: expect.any(String), $lte: expect.any(String) }),
            revoked: { $ne: true },
          }),
          populate: expect.arrayContaining(['achievement', 'recipient']),
        })
      )
      expect(result).toEqual(mockCredentials)
    })
  })

  describe('wasAlreadyNotified', () => {
    it('should return true when an audit entry exists', async () => {
      ;(global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([{ id: 1 }])

      const result = await service.wasAlreadyNotified('urn:uuid:abc', '7d')

      expect(result).toBe(true)
    })

    it('should return false when no audit entry exists', async () => {
      ;(global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([])

      const result = await service.wasAlreadyNotified('urn:uuid:abc', '7d')

      expect(result).toBe(false)
    })
  })

  describe('notifyIfNeeded', () => {
    it('should skip credentials with no recipient email', async () => {
      const credential = { id: 1, credentialId: 'urn:uuid:abc', expirationDate: new Date(Date.now() + 5 * 86400000), recipient: {} }

      const result = await service.notifyIfNeeded(credential, 7)

      expect(result).toBe(false)
      expect(global.strapi.entityService.findMany).not.toHaveBeenCalled()
    })

    it('should skip if already notified', async () => {
      const credential = {
        id: 1,
        credentialId: 'urn:uuid:abc',
        expirationDate: new Date(Date.now() + 5 * 86400000),
        recipient: { email: 'test@example.com' },
        achievement: { achievementType: 'Test Badge' },
      }
      ;(global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([{ id: 99 }]) // already notified

      const result = await service.notifyIfNeeded(credential, 7)

      expect(result).toBe(false)
      expect(global.strapi.plugins.email.services.email.send).not.toHaveBeenCalled()
    })

    it('should send email and record audit entry when not yet notified', async () => {
      const credential = {
        id: 1,
        credentialId: 'urn:uuid:abc',
        expirationDate: new Date(Date.now() + 5 * 86400000),
        recipient: { email: 'test@example.com' },
        achievement: { achievementType: 'Test Badge' },
      }
      ;(global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([]) // not yet notified
      ;(global.strapi.entityService.create as jest.Mock).mockResolvedValue({ id: 100 })
      ;(global.strapi.plugins.email.services.email.send as jest.Mock).mockResolvedValue(undefined)

      const result = await service.notifyIfNeeded(credential, 7)

      expect(result).toBe(true)
      expect(global.strapi.plugins.email.services.email.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@example.com' })
      )
      expect(global.strapi.entityService.create).toHaveBeenCalledWith(
        'api::audit-log-entry.audit-log-entry',
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'expiration_warning_7d',
            entityId: 'urn:uuid:abc',
            actorType: 'system',
          }),
        })
      )
    })

    it('should return false and log error when email send fails', async () => {
      const credential = {
        id: 1,
        credentialId: 'urn:uuid:abc',
        expirationDate: new Date(Date.now() + 5 * 86400000),
        recipient: { email: 'test@example.com' },
        achievement: { achievementType: 'Test Badge' },
      }
      ;(global.strapi.entityService.findMany as jest.Mock).mockResolvedValue([]) // not yet notified
      ;(global.strapi.plugins.email.services.email.send as jest.Mock).mockRejectedValue(new Error('SMTP error'))

      const result = await service.notifyIfNeeded(credential, 7)

      expect(result).toBe(false)
      expect(global.strapi.log.error).toHaveBeenCalled()
    })
  })

  describe('runDailyCheck', () => {
    it('should return skipped summary when notifications are disabled', async () => {
      ;(global.strapi.config.get as jest.Mock).mockReturnValue(false)

      const result = await service.runDailyCheck()

      expect(result).toEqual({ checked: 0, notified: 0, errors: 0 })
      expect(global.strapi.entityService.findMany).not.toHaveBeenCalled()
    })

    it('should return summary counts when notifications are enabled', async () => {
      ;(global.strapi.config.get as jest.Mock).mockImplementation((key: string, def: any) => def)
      // findMany returns one expiring credential for each window, then no audit entry
      ;(global.strapi.entityService.findMany as jest.Mock)
        .mockResolvedValue([
          {
            id: 1,
            credentialId: 'urn:uuid:test',
            expirationDate: new Date(Date.now() + 2 * 86400000),
            recipient: { email: 'holder@example.com' },
            achievement: { achievementType: 'Test Badge' },
          },
        ])
      ;(global.strapi.entityService.create as jest.Mock).mockResolvedValue({ id: 10 })
      ;(global.strapi.plugins.email.services.email.send as jest.Mock).mockResolvedValue(undefined)

      // For wasAlreadyNotified calls: alternate not-notified (empty array)
      // The first findMany call from findExpiringSoon returns credentials,
      // subsequent findMany calls from wasAlreadyNotified return []
      ;(global.strapi.entityService.findMany as jest.Mock)
        .mockResolvedValueOnce([{ id: 1, credentialId: 'urn:uuid:test', expirationDate: new Date(Date.now() + 2 * 86400000), recipient: { email: 'holder@example.com' }, achievement: { achievementType: 'Test Badge' } }])
        .mockResolvedValueOnce([]) // wasAlreadyNotified for 30d
        .mockResolvedValueOnce([{ id: 1, credentialId: 'urn:uuid:test', expirationDate: new Date(Date.now() + 2 * 86400000), recipient: { email: 'holder@example.com' }, achievement: { achievementType: 'Test Badge' } }])
        .mockResolvedValueOnce([]) // wasAlreadyNotified for 7d
        .mockResolvedValueOnce([{ id: 1, credentialId: 'urn:uuid:test', expirationDate: new Date(Date.now() + 2 * 86400000), recipient: { email: 'holder@example.com' }, achievement: { achievementType: 'Test Badge' } }])
        .mockResolvedValueOnce([]) // wasAlreadyNotified for 1d

      const result = await service.runDailyCheck()

      expect(result.errors).toBe(0)
      expect(result.checked).toBeGreaterThan(0)
    })
  })
})

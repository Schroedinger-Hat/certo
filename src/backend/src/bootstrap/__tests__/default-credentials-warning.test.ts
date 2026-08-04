import { warnIfDefaultAdminCredentials } from '../default-credentials-warning'
import { DEFAULT_SEED_CONFIG } from '../seed-data'

function makeFakeStrapi(options: {
  adminUser: { password: string } | null
  stillDefault: boolean
}) {
  const warn = jest.fn()
  const error = jest.fn()
  return {
    strapi: {
      log: { warn, error },
      db: {
        query: (uid: string) => {
          if (uid !== 'admin::user') throw new Error(`Unexpected query uid: ${uid}`)
          return { findOne: async () => options.adminUser }
        },
      },
      service: (uid: string) => {
        if (uid !== 'admin::auth') throw new Error(`Unexpected service uid: ${uid}`)
        return { validatePassword: async () => options.stillDefault }
      },
    },
    warn,
    error,
  }
}

describe('warnIfDefaultAdminCredentials', () => {
  it('warns when the default admin account still has its seeded password', async () => {
    const { strapi, warn } = makeFakeStrapi({ adminUser: { password: 'hashed' }, stillDefault: true })
    await warnIfDefaultAdminCredentials(strapi)
    expect(warn).toHaveBeenCalled()
    const messages = warn.mock.calls.map((call) => call[0]).join('\n')
    expect(messages).toContain(DEFAULT_SEED_CONFIG.adminEmail)
  })

  it('does not warn when the password has been changed', async () => {
    const { strapi, warn } = makeFakeStrapi({ adminUser: { password: 'hashed' }, stillDefault: false })
    await warnIfDefaultAdminCredentials(strapi)
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn when the default admin account does not exist', async () => {
    const { strapi, warn } = makeFakeStrapi({ adminUser: null, stillDefault: true })
    await warnIfDefaultAdminCredentials(strapi)
    expect(warn).not.toHaveBeenCalled()
  })
})

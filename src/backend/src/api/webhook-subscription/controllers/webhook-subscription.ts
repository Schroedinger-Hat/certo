const SUPPORTED_EVENTS = new Set([
  'credential.issued',
  'credential.revoked',
  'credential.renewed',
  'credential.expired',
  'credential.deleted',
  'achievement.created',
  'achievement.updated',
  'achievement.deleted',
  'issuer.created',
  'issuer.updated',
  'user.created',
])

function sanitize(subscription: any) {
  const { secret, ...safeSubscription } = subscription
  return safeSubscription
}

function validateInput(input: any) {
  if (!input || typeof input !== 'object') return 'Subscription data is required'

  try {
    const url = new URL(input.url)
    if (!['http:', 'https:'].includes(url.protocol)) return 'Webhook URL must use http or https'
  } catch {
    return 'Webhook URL must be a valid URL'
  }

  if (typeof input.secret !== 'string' || input.secret.length < 16) {
    return 'Webhook secret must be at least 16 characters'
  }

  if (!Array.isArray(input.events) || input.events.length === 0) {
    return 'At least one webhook event is required'
  }

  const unsupported = input.events.filter(event => typeof event !== 'string' || !SUPPORTED_EVENTS.has(event))
  if (unsupported.length > 0) return `Unsupported webhook event: ${unsupported[0]}`

  return null
}

export default {
  async find(ctx) {
    const subscriptions = await strapi.entityService.findMany(
      'api::webhook-subscription.webhook-subscription',
      { sort: { id: 'desc' } },
    )
    return { data: (subscriptions || []).map(sanitize) }
  },

  async findOne(ctx) {
    const subscription = await strapi.entityService.findOne(
      'api::webhook-subscription.webhook-subscription',
      ctx.params.id,
    )
    if (!subscription) return ctx.notFound('Webhook subscription not found')
    return { data: sanitize(subscription) }
  },

  async create(ctx) {
    const data = ctx.request.body?.data || ctx.request.body
    const validationError = validateInput(data)
    if (validationError) return ctx.badRequest(validationError)

    const subscription = await strapi.entityService.create(
      'api::webhook-subscription.webhook-subscription',
      { data: { url: data.url, events: Array.from(new Set(data.events as string[])), secret: data.secret, enabled: data.enabled !== false } },
    )
    return { data: sanitize(subscription) }
  },

  async update(ctx) {
    const existing = await strapi.entityService.findOne(
      'api::webhook-subscription.webhook-subscription',
      ctx.params.id,
    )
    if (!existing) return ctx.notFound('Webhook subscription not found')

    const data = ctx.request.body?.data || ctx.request.body
    const merged = {
      url: data.url ?? existing.url,
      events: data.events ?? existing.events,
      secret: data.secret ?? existing.secret,
    }
    const validationError = validateInput(merged)
    if (validationError) return ctx.badRequest(validationError)

    const subscription = await strapi.entityService.update(
      'api::webhook-subscription.webhook-subscription',
      ctx.params.id,
      { data: { ...merged, enabled: data.enabled ?? existing.enabled } },
    )
    return { data: sanitize(subscription) }
  },

  async delete(ctx) {
    const subscription = await strapi.entityService.delete(
      'api::webhook-subscription.webhook-subscription',
      ctx.params.id,
    )
    if (!subscription) return ctx.notFound('Webhook subscription not found')
    return { data: sanitize(subscription) }
  },
}
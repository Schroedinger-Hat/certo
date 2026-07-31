/**
 * Audit log: a record of who did what, for the actions that matter most -
 * particularly the ones known-issues-and-dev-notes.md item 5 flags as
 * bypassing Strapi's normal permission checks in code, where "who did
 * this" isn't otherwise derivable from Strapi's own request logs.
 *
 * Deliberately minimal: just entityService.create. No read/query API yet -
 * there's no dashboard for this, entries are viewed via the admin panel's
 * content manager.
 */
export default ({ strapi }: { strapi: any }) => ({
  async record({
    action,
    entityType,
    entityId,
    actorId,
    metadata,
  }: {
    action: string
    entityType: string
    entityId: string | number
    actorId?: number | null
    metadata?: Record<string, unknown>
  }) {
    await strapi.entityService.create('api::audit-log-entry.audit-log-entry', {
      data: {
        action,
        entityType,
        entityId: String(entityId),
        actorId: actorId ?? null,
        actorType: actorId ? 'user' : 'system',
        metadata: metadata ?? {},
      },
    })
  },
})

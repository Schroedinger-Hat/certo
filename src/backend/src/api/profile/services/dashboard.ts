/**
 * Per-issuer dashboard statistics.
 *
 * Queries credential/achievement tables for the given profile id and returns
 * aggregated counts suitable for the frontend profile dashboard. All counts are
 * scoped to the authenticated user's own profile so no cross-tenant data leaks.
 */

interface TopAchievement {
  id: number;
  name: string;
  count: number;
}

interface MonthlyIssuance {
  month: string;
  count: number;
}

export interface DashboardStats {
  /** Credentials this profile issued (published_at IS NOT NULL) */
  credentialsIssued: number;
  /** Issued credentials that have been revoked */
  credentialsRevoked: number;
  /** Issued credentials past their expirationDate (and not revoked) */
  credentialsExpired: number;
  /** Credentials where this profile is the recipient */
  credentialsReceived: number;
  /** Achievements created by this profile */
  achievementsCreated: number;
  /** Distinct recipient profiles across all issued credentials */
  uniqueRecipients: number;
  /** Top 5 achievements by number of credentials issued against them */
  topAchievements: TopAchievement[];
  /** Credential issuance counts for the trailing twelve calendar months */
  issuanceTrend: MonthlyIssuance[];
  /** ISO 8601 creation timestamp of the underlying users-permissions user */
  memberSince: string;
}

export default ({ strapi }: { strapi: any }) => ({
  async getStats(userId: number, profileId: number): Promise<DashboardStats> {
    const now = new Date();

    // Run independent queries in parallel
    const [
      credentialsIssued,
      credentialsRevoked,
      credentialsExpired,
      credentialsReceived,
      achievementsCreated,
      issuedWithRecipient,
      topRaw,
      user,
    ] = await Promise.all([
      strapi.db.query('api::credential.credential').count({
        where: { issuer: profileId },
      }),
      strapi.db.query('api::credential.credential').count({
        where: { issuer: profileId, revoked: true },
      }),
      strapi.db.query('api::credential.credential').count({
        where: {
          issuer: profileId,
          revoked: false,
          expirationDate: { $lt: now.toISOString() },
        },
      }),
      strapi.db.query('api::credential.credential').count({
        where: { recipient: profileId },
      }),
      strapi.db.query('api::achievement.achievement').count({
        where: { creator: profileId },
      }),
      // For uniqueRecipients we need distinct IDs - fetch minimal fields only
      strapi.db.query('api::credential.credential').findMany({
        where: { issuer: profileId },
        populate: { recipient: { fields: ['id'] } },
        fields: ['id'],
      }),
      // Top achievements and issuance trend share the same minimal query.
      strapi.db.query('api::credential.credential').findMany({
        where: { issuer: profileId },
        populate: { achievement: { fields: ['id', 'achievementName'] } },
        fields: ['id', 'issuanceDate'],
      }),
      strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['createdAt'],
      }),
    ]);

    // Unique recipients
    const recipientIds = new Set(
      (issuedWithRecipient as any[])
        .map((c) => c.recipient?.id)
        .filter(Boolean)
    );

    // Top achievements (up to 5)
    const achievementCounts = new Map<number, { name: string; count: number }>();
    for (const cred of topRaw as any[]) {
      const ach = cred.achievement;
      if (!ach?.id) continue;
      const entry = achievementCounts.get(ach.id);
      if (entry) {
        entry.count += 1;
      } else {
        achievementCounts.set(ach.id, {
          name: ach.achievementName || `Achievement ${ach.id}`,
          count: 1,
        });
      }
    }
    const topAchievements: TopAchievement[] = Array.from(achievementCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, { name, count }]) => ({ id, name, count }));

    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const nowMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const issuanceByMonth = new Map<string, number>();
    for (let offset = 11; offset >= 0; offset--) {
      const monthDate = new Date(nowMonth.getFullYear(), nowMonth.getMonth() - offset, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      issuanceByMonth.set(key, 0);
    }

    for (const credential of topRaw as any[]) {
      if (!credential.issuanceDate) continue;
      const issuanceDate = new Date(credential.issuanceDate);
      if (Number.isNaN(issuanceDate.getTime())) continue;
      const key = `${issuanceDate.getFullYear()}-${String(issuanceDate.getMonth() + 1).padStart(2, '0')}`;
      if (issuanceByMonth.has(key)) {
        issuanceByMonth.set(key, (issuanceByMonth.get(key) ?? 0) + 1);
      }
    }

    const issuanceTrend = Array.from(issuanceByMonth.entries()).map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: `${monthFormatter.format(new Date(year, month - 1, 1))} ${String(year).slice(-2)}`,
        count,
      };
    });

    return {
      credentialsIssued,
      credentialsRevoked,
      credentialsExpired,
      credentialsReceived,
      achievementsCreated,
      uniqueRecipients: recipientIds.size,
      topAchievements,
      issuanceTrend,
      memberSince: user?.createdAt ?? new Date().toISOString(),
    };
  },
});

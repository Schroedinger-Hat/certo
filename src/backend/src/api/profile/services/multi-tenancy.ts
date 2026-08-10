/**
 * Multi-tenancy service
 *
 * Provides utilities for enforcing data isolation based on user ownership
 * Scopes queries to the authenticated user's owned profiles and related data
 */

export default () => ({
  /**
   * Get all profiles accessible to a user.
   * - Profiles owned by the user (owner.id = userId)
   * - Profiles with no owner (legacy/pre-multi-tenancy resources, accessible to all)
   */
  async getUserProfiles(userId: number) {
    return strapi.entityService.findMany('api::profile.profile', {
      filters: {
        $or: [
          { owner: { id: userId } },
          { owner: null },
        ],
      } as any,
    });
  },

  /**
   * Get profile IDs owned by a user for use in subqueries
   */
  async getUserProfileIds(userId: number) {
    const profiles = await this.getUserProfiles(userId);
    return profiles.map((p: any) => p.id);
  },

  /**
   * Get all achievements created by user's profiles
   */
  async getUserAchievements(userId: number, filters?: any) {
    const profileIds = await this.getUserProfileIds(userId);

    return strapi.entityService.findMany('api::achievement.achievement', {
      filters: {
        ...filters,
        creator: { id: { $in: profileIds } },
      } as any,
    });
  },

  /**
   * Get all credentials issued by user's profiles or received by user's profiles
   * Filters by both issuer and recipient for complete visibility
   */
  async getUserCredentials(userId: number, filters?: any) {
    const profileIds = await this.getUserProfileIds(userId);

    return strapi.entityService.findMany('api::credential.credential', {
      filters: {
        ...filters,
        $or: [
          { issuer: { id: { $in: profileIds } } },
          { recipient: { id: { $in: profileIds } } },
        ],
      } as any,
      populate: ['achievement', 'issuer', 'recipient'] as any,
    });
  },

  /**
   * Check if a user can access a profile.
   * Returns true if the user owns it, or if the profile has no owner (legacy resource).
   */
  async userOwnsProfile(userId: number, profileId: number): Promise<boolean> {
    const profile = (await strapi.entityService.findOne('api::profile.profile', profileId)) as any;
    if (!profile) return false;
    // Profiles without an owner are legacy resources — accessible to any authenticated user
    if (!profile.owner) return true;
    return profile.owner.id === userId;
  },

  /**
   * Check if a user can access a credential (owns issuer or recipient profile, or those profiles are unowned).
   * A profile with no owner is a legacy resource accessible to any authenticated user.
   */
  async userCanAccessCredential(userId: number, credentialId: number): Promise<boolean> {
    const credential = (await strapi.entityService.findOne('api::credential.credential', credentialId, {
      populate: ['issuer', 'recipient'],
    })) as any;

    if (!credential) return false;

    // Null owner = legacy profile, accessible to all authenticated users
    const issuerAccessible = !credential.issuer?.owner || credential.issuer.owner.id === userId;
    const recipientAccessible = !credential.recipient?.owner || credential.recipient.owner.id === userId;

    return issuerAccessible || recipientAccessible;
  },

  /**
   * Check if a user can access an achievement (owns creator profile, or creator has no owner).
   * A creator profile with no owner is a legacy resource accessible to any authenticated user.
   */
  async userCanAccessAchievement(userId: number, achievementId: number): Promise<boolean> {
    const achievement = (await strapi.entityService.findOne('api::achievement.achievement', achievementId, {
      populate: ['creator'],
    })) as any;

    if (!achievement) return false;

    // Null owner = legacy creator profile, accessible to all authenticated users
    return !achievement.creator?.owner || achievement.creator.owner.id === userId;
  },

  /**
   * Get all evidence for a user's credentials
   */
  async getUserEvidence(userId: number) {
    const credentials = await this.getUserCredentials(userId);
    const credentialIds = credentials.map((c: any) => c.id);

    if (credentialIds.length === 0) {
      return [];
    }

    return strapi.entityService.findMany('api::evidence.evidence', {
      filters: { credential: { id: { $in: credentialIds } } } as any,
    });
  },
});

/**
 * Overrides the users-permissions plugin's `me` controller so the logged-in
 * user's `role` can actually be populated (e.g. GET /api/users/me?populate=*).
 *
 * Strapi's built-in `me` controller runs the requested `populate` through
 * strapi.contentAPI.validate.query, which doesn't allow `role` by default -
 * so any request that would include it is rejected with a 403, regardless of
 * how the Authenticated role's permissions are actually configured. Fetching
 * the role directly via strapi.db.query bypasses that unrelated validation
 * layer, which only exists to guard content-type relations, not this plugin
 * relation.
 */
export default (plugin: any) => {
  plugin.controllers.user.me = async (ctx: any) => {
    const authUser = ctx.state.user;
    if (!authUser) {
      return ctx.unauthorized();
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: ['role'],
    });

    if (!user) {
      return ctx.notFound();
    }

    const { password, resetPasswordToken, confirmationToken, ...safeUser } = user;
    ctx.body = safeUser;
  };

  return plugin;
};

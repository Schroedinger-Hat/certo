export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'e4350524b0633dbc71742b53209d43f0'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'c7af882fa3c9c3c18bbbc1e87cf2e842'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'c7af882fa3c9c3c18bbbc1e87cf2e842'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});

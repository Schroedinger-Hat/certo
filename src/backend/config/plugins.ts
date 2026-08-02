export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
      jwt: {
        expiresIn: '7d',
      },
      ratelimit: {
        interval: 60000,
        max: 100,
      },
      defaultRole: 'authenticated',
      public: {
        defaultRole: 'public',
      },
      advanced: {
        unique_email: true,
        allow_register: true,
        email_confirmation: false,
        email_reset_password: {
          from: {
            name: 'Certo Support',
            email: env('SMTP_FROM', 'gw7t4cqccle4qv53@ethereal.email'),
          },
          subject: 'Reset your password for Certo',
          message: `<p>Hello,</p>
<p>We received a request to reset your password for your Certo account.</p>
<p>Please click the link below to set a new password:</p>
<p><%= URL %>?code=<%= TOKEN %></p>
<p>If you did not request this, please ignore this email.</p>
<p>Thanks,</p>
<p>The Certo Team</p>`,
        },
        email_confirmation_redirection: null,
        default_role: 'authenticated',
      },
    },
  },
  upload: {
    config: {
      provider: 'local',
      providerOptions: {},
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
      sizeLimit: 10 * 1024 * 1024, // 10MB in bytes
      settings: {
        // Make uploads accessible publicly
        accessControl: true,
        public: true,
      },
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        // Falls back to Ethereal (a disposable test inbox) for dev when SMTP_* isn't set.
        host: env('SMTP_HOST', 'smtp.ethereal.email'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME', 'gw7t4cqccle4qv53@ethereal.email'),
          pass: env('SMTP_PASSWORD', 'VxnCkssx2Yw2kTfQfz'),
        },
        // Defaults suit both Ethereal (opportunistic STARTTLS on 587) and
        // Mailhog (plain SMTP, no TLS support) without extra config.
        secure: env.bool('SMTP_SECURE', false), // true for 465, false for other ports
        requireTLS: env.bool('SMTP_REQUIRE_TLS', false), // force STARTTLS; Mailhog can't do this
        ignoreTLS: false, // Don't ignore TLS
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'gw7t4cqccle4qv53@ethereal.email'),
        defaultReplyTo: env('SMTP_REPLY_TO', 'gw7t4cqccle4qv53@ethereal.email'),
      },
    },
  },
});

export default {
  routes: [
    { method: 'POST', path: '/scheduled-issuances', handler: 'scheduled-issuance.create', config: { auth: { strategies: ['users-permissions'] } } },
    { method: 'GET',  path: '/scheduled-issuances', handler: 'scheduled-issuance.find',   config: { auth: { strategies: ['users-permissions'] } } },
    { method: 'POST', path: '/scheduled-issuances/:id/cancel', handler: 'scheduled-issuance.cancel', config: { auth: { strategies: ['users-permissions'] } } },
    { method: 'POST', path: '/scheduled-issuances/run-check',  handler: 'scheduled-issuance.runCheck', config: { auth: { strategies: ['users-permissions'] } } },
  ],
};

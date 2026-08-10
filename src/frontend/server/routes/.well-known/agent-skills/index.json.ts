/**
 * GET /.well-known/agent-skills/index.json
 *
 * Agent Skills Discovery index per the Agent Skills Discovery RFC v0.2.0.
 * Lists the machine-callable skills (tools) that Certo exposes to AI agents.
 * https://github.com/cloudflare/agent-skills-discovery-rfc
 */
export default defineEventHandler(() => ({
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: [
    {
      name: 'verify-credential',
      type: 'skill-md',
      description: 'Verify an Open Badges 3.0 / Verifiable Credential by URN or ID',
      url: 'https://certo.schroedinger-hat.org/.well-known/agent-skills/verify-credential/SKILL.md',
      digest: 'sha256:f11625fabf95766553cbd0b4adecc97c00bcb2bf95a6e0f8752e9722c8c764a3',
    },
    {
      name: 'issue-credential',
      type: 'skill-md',
      description: 'Issue an Open Badges 3.0 credential to a recipient by email',
      url: 'https://certo.schroedinger-hat.org/.well-known/agent-skills/issue-credential/SKILL.md',
      digest: 'sha256:753e5fc4f2d3d40010cff5e23f1b6b6707d0bd451d37e2d100b96806ae21ecfa',
    },
    {
      name: 'list-achievements',
      type: 'skill-md',
      description: 'List available badge definitions (achievements) in a Certo instance',
      url: 'https://certo.schroedinger-hat.org/.well-known/agent-skills/list-achievements/SKILL.md',
      digest: 'sha256:9e85663592b309a0dddb713958536f0e1f5a5cdc40cdd2e68020ecc60bce72d9',
    },
    {
      name: 'revoke-credential',
      type: 'skill-md',
      description: 'Revoke an issued credential, rendering it invalid for future verification',
      url: 'https://certo.schroedinger-hat.org/.well-known/agent-skills/revoke-credential/SKILL.md',
      digest: 'sha256:fb75d512580546547686f7dc69a2d8d8852b70eabb20d664ec802c1be3f54189',
    },
  ],
}))

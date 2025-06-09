import type { Schema, Struct } from '@strapi/strapi';

export interface BadgeAlignment extends Struct.ComponentSchema {
  collectionName: 'components_badge_alignments';
  info: {
    description: 'Alignment to standards, skills, or competencies';
    displayName: 'Alignment';
  };
  attributes: {
    targetCode: Schema.Attribute.String;
    targetDescription: Schema.Attribute.Text;
    targetFramework: Schema.Attribute.String;
    targetName: Schema.Attribute.String & Schema.Attribute.Required;
    targetUrl: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BadgeCriteria extends Struct.ComponentSchema {
  collectionName: 'components_badge_criteria';
  info: {
    description: 'Criteria for achievement completion';
    displayName: 'Criteria';
  };
  attributes: {
    narrative: Schema.Attribute.Text;
    url: Schema.Attribute.String;
  };
}

export interface BadgeProof extends Struct.ComponentSchema {
  collectionName: 'components_badge_proofs';
  info: {
    description: 'Cryptographic proof for verifiable credentials';
    displayName: 'Proof';
  };
  attributes: {
    created: Schema.Attribute.DateTime & Schema.Attribute.Required;
    jws: Schema.Attribute.Text;
    proofPurpose: Schema.Attribute.String & Schema.Attribute.Required;
    proofValue: Schema.Attribute.Text;
    type: Schema.Attribute.String & Schema.Attribute.Required;
    verificationMethod: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BadgePublicKey extends Struct.ComponentSchema {
  collectionName: 'components_badge_public_keys';
  info: {
    description: 'Public key for verification of signatures';
    displayName: 'Public Key';
  };
  attributes: {
    controller: Schema.Attribute.String & Schema.Attribute.Required;
    expirationDate: Schema.Attribute.DateTime;
    identifier: Schema.Attribute.String & Schema.Attribute.Required;
    publicKeyJwk: Schema.Attribute.JSON;
    publicKeyMultibase: Schema.Attribute.String;
    revoked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    type: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BadgeSkill extends Struct.ComponentSchema {
  collectionName: 'components_badge_skills';
  info: {
    description: 'Skills associated with achievements';
    displayName: 'Skill';
  };
  attributes: {
    level: Schema.Attribute.String;
    skillDescription: Schema.Attribute.Text;
    skillName: Schema.Attribute.String & Schema.Attribute.Required;
    skillType: Schema.Attribute.String;
    skillUrl: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'badge.alignment': BadgeAlignment;
      'badge.criteria': BadgeCriteria;
      'badge.proof': BadgeProof;
      'badge.public-key': BadgePublicKey;
      'badge.skill': BadgeSkill;
    }
  }
}

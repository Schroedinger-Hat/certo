# Open Badges Implementation

## Spec version

Explicitly **Open Badges 3.0** (IMS Global), layered on **W3C Verifiable
Credentials v2**. Confirmed by the `@context` array used everywhere a credential
is serialized:

```json
[
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
]
```

There is no OBv2 support (no "badge baking" into PNG metadata — see
[strapi-and-credentials.md](./strapi-and-credentials.md#certificates)).

## Where it's implemented

Everything lives in
`src/backend/src/api/credential/services/open-badge.ts`, plus signing helpers
duplicated in `credential.ts` (see below).

### `serializeCredential(credentialId)`

Builds the full OBv3 `VerifiableCredential` / `OpenBadgeCredential` object from
a stored `credential` row:

- `@context`, `id` (= the stored `credentialId`, a `urn:uuid:...` string), `type: ['VerifiableCredential', 'OpenBadgeCredential']`
- `issuer`: `{ id: '<baseUrl>/api/profiles/<issuerId>/issuer', type: ['Profile'], name, url }`
- `issuanceDate` / `validFrom`
- `credentialSubject.id` = `mailto:<recipient email>` (if the recipient has an email)
- `credentialSubject.achievement`: `id`, `type: ['Achievement']`, `name`, `description`, `image`, `criteria.narrative`, and `alignments[]` (mapped from the `alignment` component) if present
- `credentialSubject.achievement.evidence[]` if the credential has evidence
- `expirationDate` if set
- `proof`: reuses the credential's stored proof if present; **otherwise signs
  the object on the fly** right here (see "Signing" below) — meaning
  `serializeCredential` can itself produce a new signature at read time, not
  just at issuance time, if the DB row somehow lacks a `proof`.

### `validateExternalCredential(credential)` / `validateCredentialFormat(credential)`

Used when someone submits an external OBv3 credential for verification/import.
Checks: has `id`, has `type` including both `VerifiableCredential` and
`OpenBadgeCredential`, has `issuer`, has `credentialSubject`, has
`issuanceDate`. Issuer verification: DIDs are auto-accepted
(`issuerVerified = true`, explicitly a placeholder), HTTP(S) issuer URLs are
checked against `findIssuerByUrl` (looks for a matching local `profile` by
numeric ID parsed out of a `/api/profiles/:id` URL — so this only recognizes
issuers that are also profiles in *this* Strapi instance). **Proof verification
here is a hardcoded `const proofVerified = true`** — explicitly a placeholder in
the code, not a real check.

### `importCredential(vcData)`

The reverse direction: takes an external OBv3 VC JSON and find-or-creates local
`profile` (issuer, keyed by `did`), `achievement` (keyed by
`achievementId`), `credential`, and `evidence` rows from it. This is the closest
thing in the codebase to an interoperability/import feature.

## Signing

- **Algorithm**: Ed25519 (`EdDSA`), via the `jose` npm package's `SignJWT`,
  producing a compact JWS string stored as `proof.jws`.
- **Proof shape**: `{ type: 'Ed25519Signature2020', created, verificationMethod, proofPurpose: 'assertionMethod', jws }`.
- **Key**: a single global `ED25519_PRIVATE_KEY_PKCS8` env var (base64-encoded
  PKCS8), loaded independently in both `credential.ts`'s `generateProof()` and
  `open-badge.ts`'s `getEd25519PrivateKey()` — two separate implementations of
  the same key-loading logic.
- **Every issuer currently shares this one signing key.** The `profile` content
  type has a `publicKey` component (`Ed25519VerificationKey2020` shape,
  `publicKeyJwk`/`publicKeyMultibase`) and a `did` field, modeling a
  per-issuer-key / DID design — but nothing in the signing or verification code
  actually reads from `profile.publicKey`. The data model is ready for
  multi-issuer keys; the signing code isn't wired up to use it yet.
- **A real dev private/public keypair is committed to the repo root**
  (`ed25519-private.pem`, `ed25519-public.pem`), and `docker-compose.yml` also
  hardcodes a default base64 PKCS8 value for `ED25519_PRIVATE_KEY_PKCS8`
  directly in the compose file. Fine for a throwaway dev environment; make sure
  a real deployment generates and injects its own key rather than reusing
  these.

## Verification

`src/backend/src/api/credential/services/verification.ts`'s
`verifyCredential()` → `processCredentialResult()` checks, in order:

1. `credential.revoked` boolean.
2. `credential.expirationDate` vs now.
3. `verifyProof(credential)`.

**`verifyProof()` does not check the cryptographic signature.** It only checks
structural things: proof exists, has `type`/`created`/`verificationMethod`/
`proofPurpose`, has either `proofValue` or `jws`, `proofPurpose` is one of the
allowed enum values, and the proof isn't more than 10 years old. The function's
own comment is explicit about this:

```ts
// In a real implementation, we would:
// 1. Fetch the issuer's public key using the verificationMethod in the proof
// 2. Verify the signature using the appropriate algorithm (e.g., Ed25519, JsonWebSignature2020)
// 3. Check that the proof was created by the expected issuer
...
// For now, since we're not implementing actual cryptographic verification,
// we'll accept any proof that passes the above checks
```

**Do not describe "verify a badge" as cryptographically secure in any
user-facing or partner-facing material until this is implemented** — today, a
structurally well-formed but unsigned/fake proof (see the `generateProof`
fallback in [strapi-and-credentials.md](./strapi-and-credentials.md)) will pass
verification. Implementing real verification means: fetch/derive the issuer's
public key (from `profile.publicKey` or by resolving `did`), verify the JWS with
`jose`'s `jwtVerify`/`compactVerify` using that key, and reject on any mismatch.

## Endorsements

The `endorsement` content type mirrors the OBv3 Endorsement Credential shape
(`endorser`, `endorsedObject`, `claim`, `proof`) and has a controller `verify`
route (`endorsement-verify.ts`), but no dedicated serialization/signing service
comparable to `open-badge.ts` — it's less built out than `credential`.

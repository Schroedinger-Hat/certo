import type { HttpClient } from '../http.js';
import type {
  Profile,
  ProfileExport,
  StrapiSingleResponse,
} from '../types.js';

export class ProfilesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the profile of the currently authenticated user.
   *
   * @example
   * const profile = await client.profiles.me();
   */
  me(): Promise<Profile> {
    return this.http.get<Profile>('/api/profiles/me');
  }

  /**
   * Get a profile by numeric id.
   *
   * @example
   * const { data } = await client.profiles.get(1);
   */
  get(id: number | string): Promise<StrapiSingleResponse<Profile>> {
    return this.http.get<StrapiSingleResponse<Profile>>(`/api/profiles/${id}`);
  }

  /**
   * Export the authenticated user's full profile data (achievements + credentials)
   * as a portable JSON document.
   *
   * @example
   * const data = await client.profiles.export();
   * fs.writeFileSync('my-certo-data.json', JSON.stringify(data, null, 2));
   */
  export(): Promise<ProfileExport> {
    return this.http.get<ProfileExport>('/api/profiles/me/export');
  }

  /**
   * Import a previously exported profile data bundle.
   * Merges achievements and received credentials idempotently.
   *
   * @example
   * const bundle = JSON.parse(fs.readFileSync('my-certo-data.json', 'utf-8'));
   * await client.profiles.import(bundle);
   */
  import(bundle: ProfileExport): Promise<{ imported: { achievements: number; credentials: number } }> {
    return this.http.post('/api/profiles/me/import', bundle);
  }

  /**
   * Update the authenticated user's public key for verification.
   * Returns the updated key entry.
   */
  regenerateKey(): Promise<{ identifier: string; publicKeyJwk: Record<string, string> }> {
    return this.http.post('/api/profiles/me/keys/regenerate');
  }
}

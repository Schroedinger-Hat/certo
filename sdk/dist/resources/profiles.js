export class ProfilesResource {
    constructor(http) {
        this.http = http;
    }
    /**
     * Get the profile of the currently authenticated user.
     *
     * @example
     * const profile = await client.profiles.me();
     */
    me() {
        return this.http.get('/api/profiles/me');
    }
    /**
     * Get a profile by numeric id.
     *
     * @example
     * const { data } = await client.profiles.get(1);
     */
    get(id) {
        return this.http.get(`/api/profiles/${id}`);
    }
    /**
     * Export the authenticated user's full profile data (achievements + credentials)
     * as a portable JSON document.
     *
     * @example
     * const data = await client.profiles.export();
     * fs.writeFileSync('my-certo-data.json', JSON.stringify(data, null, 2));
     */
    export() {
        return this.http.get('/api/profiles/me/export');
    }
    /**
     * Import a previously exported profile data bundle.
     * Merges achievements and received credentials idempotently.
     *
     * @example
     * const bundle = JSON.parse(fs.readFileSync('my-certo-data.json', 'utf-8'));
     * await client.profiles.import(bundle);
     */
    import(bundle) {
        return this.http.post('/api/profiles/me/import', bundle);
    }
    /**
     * Update the authenticated user's public key for verification.
     * Returns the updated key entry.
     */
    regenerateKey() {
        return this.http.post('/api/profiles/me/keys/regenerate');
    }
}
//# sourceMappingURL=profiles.js.map
/**
 * SDK-specific error class. Thrown for any non-2xx HTTP response.
 */
export class CertoApiError extends Error {
    constructor(message, statusCode, body) {
        super(message);
        this.name = 'CertoApiError';
        this.statusCode = statusCode;
        this.body = body;
    }
}
//# sourceMappingURL=errors.js.map
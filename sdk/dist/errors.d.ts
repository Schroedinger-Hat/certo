/**
 * SDK-specific error class. Thrown for any non-2xx HTTP response.
 */
export declare class CertoApiError extends Error {
    readonly statusCode: number;
    readonly body: unknown;
    constructor(message: string, statusCode: number, body: unknown);
}
//# sourceMappingURL=errors.d.ts.map
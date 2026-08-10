/**
 * GET /.well-known/api-catalog
 *
 * RFC 9727 API Catalog — machine-readable discovery of Certo's REST API.
 * Content-Type: application/linkset+json
 * https://www.rfc-editor.org/rfc/rfc9727
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/linkset+json')
  return {
    linkset: [
      {
        anchor: 'https://certo.schroedinger-hat.org/api',
        'service-desc': [
          {
            href: 'https://certo.schroedinger-hat.org/api/documentation/v1.0.0/full_documentation.json',
            type: 'application/vnd.oai.openapi+json',
            title: 'Certo OpenAPI 3.0 specification',
          },
        ],
        'service-doc': [
          {
            href: 'https://certo.schroedinger-hat.org/api/documentation',
            type: 'text/html',
            title: 'Certo API documentation (Swagger UI)',
          },
        ],
        status: [
          {
            href: 'https://certo.schroedinger-hat.org/api/health',
            type: 'application/json',
            title: 'Health check endpoint',
          },
        ],
        // Prometheus metrics
        'https://www.iana.org/assignments/link-relations/monitoring': [
          {
            href: 'https://certo.schroedinger-hat.org/api/metrics',
            type: 'text/plain',
            title: 'Prometheus metrics endpoint',
          },
        ],
      },
    ],
  }
})

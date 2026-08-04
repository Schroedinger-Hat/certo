import winston from 'winston';
import { getRequestId } from '../src/utils/request-context';

// Attaches the current request's correlation id (see
// src/middlewares/request-id.ts) to every log line produced during that
// request's async execution - no changes needed to any individual
// strapi.log.*() call site.
const withRequestId = winston.format((info) => {
  const requestId = getRequestId();
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});

// Structured JSON logging for production/self-hosted deployments piping
// logs to Loki/ELK/Splunk - see docs/logging.md. Off by default: local dev
// keeps Strapi's own colored console prettyPrint() output untouched.
export default ({ env }) => {
  if (!env.bool('LOG_FORMAT_JSON', false)) {
    return {};
  }

  return {
    format: winston.format.combine(
      withRequestId(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  };
};

import winston from 'winston'
import { Writable } from 'node:stream'
import loggerConfig from '../logger'
import { requestContextStorage } from '../../src/utils/request-context'

function createCapturingStream(lines: string[]) {
  return new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString())
      callback()
    },
  })
}

function buildConfig(logFormatJson: boolean) {
  return (loggerConfig as any)({
    env: {
      bool: (_key: string, defaultValue: boolean) => logFormatJson ?? defaultValue,
    },
  })
}

describe('config/logger', () => {
  it('returns an empty config (Strapi default prettyPrint) when LOG_FORMAT_JSON is not enabled', () => {
    expect(buildConfig(false)).toEqual({})
  })

  it('returns a JSON format producing valid, parseable log lines when LOG_FORMAT_JSON is enabled', async () => {
    const config = buildConfig(true)
    expect(config.format).toBeDefined()

    const lines: string[] = []
    const logger = winston.createLogger({
      format: config.format,
      transports: [
        new winston.transports.Stream({ stream: createCapturingStream(lines) }),
      ],
    })

    logger.info('hello world')

    expect(lines).toHaveLength(1)
    const parsed = JSON.parse(lines[0])
    expect(parsed.message).toBe('hello world')
    expect(parsed.level).toBe('info')
    expect(typeof parsed.timestamp).toBe('string')
  })

  it('includes requestId in the JSON output when logged inside a request context', async () => {
    const config = buildConfig(true)
    const lines: string[] = []
    const logger = winston.createLogger({
      format: config.format,
      transports: [
        new winston.transports.Stream({ stream: createCapturingStream(lines) }),
      ],
    })

    await requestContextStorage.run({ requestId: 'req-42' }, async () => {
      logger.info('inside a request')
    })
    logger.info('outside any request')

    const [withinRequest, outsideRequest] = lines.map((line) => JSON.parse(line))
    expect(withinRequest.requestId).toBe('req-42')
    expect(outsideRequest.requestId).toBeUndefined()
  })
})

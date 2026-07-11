import type { FastifyServerOptions } from 'fastify'
import { loadConfig } from './config.ts'

export function buildLoggerOptions(): FastifyServerOptions['logger'] {
  const { LOG_LEVEL, LOG_PRETTY } = loadConfig()

  if (!LOG_PRETTY) {
    return { level: LOG_LEVEL }
  }

  return {
    level: LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }
}

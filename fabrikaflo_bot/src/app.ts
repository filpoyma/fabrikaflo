import { join } from 'node:path'
import Fastify, { type FastifyInstance, type FastifyServerOptions, type FastifyError } from 'fastify'
import autoload from '@fastify/autoload'
import { buildLoggerOptions } from './logger.ts'

export async function buildApp(
  options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildLoggerOptions(),
    disableRequestLogging: true,
    ...options,
  })

  // 1. External plugins — infrastructure (env, prisma, cors, helmet, sensible, multipart, cloudinary)
  //    Awaited so that downstream app-level and business plugins see all decorators.
  await app.register(autoload, {
    dir: join(import.meta.dirname, 'plugins/external'),
  })

  // 2. App-level plugins — cross-cutting concerns (bot, auth, system routes)
  //    Mounted on the root application path.
  await app.register(autoload, {
    dir: join(import.meta.dirname, 'plugins/app'),
    indexPattern: /^index\.(ts|js)$/,
    dirNameRoutePrefix: true,
  })

  // 3. Business modules — feature-first modules under /api/v1
  await app.register(autoload, {
    dir: join(import.meta.dirname, 'modules'),
    indexPattern: /^index\.(ts|js)$/,
    dirNameRoutePrefix: true,
    autoHooks: true,
    cascadeHooks: true,
    options: { prefix: '/api/fabrika' },
  })

  // Global Error Handler
  app.setErrorHandler((err: FastifyError, request, reply) => {
    request.log.error({ err }, 'Unhandled error occurred')

    // AJV validation errors
    if (err.validation) {
      return reply.code(400).send({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        error: 'Bad Request',
        message: err.message,
        details: err.validation,
      })
    }

    const statusCode = err.statusCode ?? 500
    const isClientError = statusCode >= 400 && statusCode < 500
    const message =
      isClientError || app.config.NODE_ENV === 'development'
        ? err.message
        : 'Internal Server Error'

    return reply.code(statusCode).send({
      statusCode,
      code: err.code ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
      error: err.name && err.name !== 'Error' ? err.name : 'Error',
      message,
    })
  })

  return app
}

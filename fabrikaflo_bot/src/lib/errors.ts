import createError from '@fastify/error'

export const NotFoundError = createError('FF_NOT_FOUND', '%s not found', 404)
export const UnauthorizedError = createError('FF_UNAUTHORIZED', 'Authentication required', 401)
export const ForbiddenError = createError('FF_FORBIDDEN', 'Access denied: %s', 403)
export const ValidationError = createError('FF_VALIDATION', '%s', 400)
export const ConflictError = createError('FF_CONFLICT', '%s already exists', 409)
export const TooManyRequestsError = createError('FF_RATE_LIMIT', 'Too many requests', 429)
export const InternalError = createError('FF_INTERNAL', 'Internal server error', 500)

import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { Config } from '../../config.ts'

export interface AccessTokenPayload {
  userId: string
  role: string
}

export function signAccessToken(
  payload: AccessTokenPayload,
  config: Config,
): string {
  // jwt typings are strict about expiresIn — we cast to satisfy the overload
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(
  token: string,
  config: Config,
): AccessTokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as AccessTokenPayload
}

export function createRefreshTokenValue(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getRefreshTokenExpiry(config: Config): Date {
  const durationMs = parseDurationToMs(config.REFRESH_TOKEN_EXPIRES_IN)
  return new Date(Date.now() + durationMs)
}

function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim())
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`)
  }

  const amount = Number(match[1])
  const unit = match[2]

  switch (unit) {
    case 's':
      return amount * 1000
    case 'm':
      return amount * 60 * 1000
    case 'h':
      return amount * 60 * 60 * 1000
    case 'd':
      return amount * 24 * 60 * 60 * 1000
    default:
      throw new Error(`Unsupported duration unit: ${unit}`)
  }
}

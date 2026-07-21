import envSchema from 'env-schema'
import { Type, type Static } from '@sinclair/typebox'

export const configSchema = Type.Object({
  HOST: Type.String({ default: '0.0.0.0' }),
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: Type.Union(
    [
      Type.Literal('trace'),
      Type.Literal('debug'),
      Type.Literal('info'),
      Type.Literal('warn'),
      Type.Literal('error'),
      Type.Literal('fatal'),
    ],
    { default: 'info' },
  ),
  LOG_PRETTY: Type.Boolean({ default: true }),
  DATABASE_URL: Type.String({ minLength: 1 }),
  NODE_ENV: Type.String({ default: 'development' }),
  
  // Telegram Bot Config
  TELEGRAM_BOT_TOKEN: Type.String({ default: '' }),
  TELEGRAM_BOT_MODE: Type.String({ default: 'polling' }), // 'polling' or 'webhook'
  TELEGRAM_WEBHOOK_URL: Type.String({ default: '' }),
  MINI_APP_URL: Type.String({ default: '' }),
  ADMIN_CHAT_ID: Type.String({ default: '' }),
  
  // Security
  JWT_SECRET: Type.String({ default: 'fabrikaflo-super-secret-key-12345' }),
  ACCESS_TOKEN_EXPIRES_IN: Type.String({ default: '15m' }),
  REFRESH_TOKEN_EXPIRES_IN: Type.String({ default: '7d' }),
  REFRESH_COOKIE_NAME: Type.String({ default: 'refresh_token' }),
  CORS_ORIGINS: Type.String({ default: '*' }),
  
  // Cloudinary Image Hosting
  CLOUDINARY_CLOUD_NAME: Type.String({ default: '' }),
  CLOUDINARY_API_KEY: Type.String({ default: '' }),
  CLOUDINARY_API_SECRET: Type.String({ default: '' }),
})

export type Config = Static<typeof configSchema>

let cached: Config | undefined

export function loadConfig(): Config {
  cached ??= envSchema<Config>({ schema: configSchema, dotenv: true })
  return cached
}

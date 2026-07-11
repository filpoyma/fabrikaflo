import { buildApp } from './app.ts'

const app = await buildApp()

try {
  await app.ready()
  await app.listen({ port: app.config.PORT, host: app.config.HOST })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down')
  try {
    await app.close()
    process.exit(0)
  } catch (err) {
    app.log.error(err, 'error during shutdown')
    process.exit(1)
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal)
  })
}

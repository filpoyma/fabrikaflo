import { test, after, before } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.ts'

let app: FastifyInstance

before(async () => {
  app = await buildApp({ logger: false })
  await app.ready()
})

after(async () => {
  await app.close()
})

test('GET / returns service status', async () => {
  const response = await app.inject({ method: 'GET', url: '/' })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), { service: 'fabrikaflo-bot', status: 'ok' })
})

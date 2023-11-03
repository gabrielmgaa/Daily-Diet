import { FastifyInstance } from 'fastify'

import { randomUUID } from 'node:crypto'

import { knex } from '../database'

import { z } from 'zod'

export async function userRoutes(app: FastifyInstance) {
  app.get('/', async (req, res) => {
    const users = await knex('users').select('*')

    return res.send(users)
  })

  app.post('/create', async (req, res) => {
    const bodySchema = z.object({
      name: z.string(),
    })

    const { name } = bodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      session_id: sessionId,
    })

    return res.status(201).send()
  })
}

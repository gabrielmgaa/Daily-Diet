import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionId } from '../middlewares/check-session-id'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', async (req, res) => {
    const meals = await knex('meals').select('*')

    return res.send(meals)
  })

  app.get('/me', { preHandler: checkSessionId }, async (req, res) => {
    const sessionId = req.cookies.sessionId

    const mealsBySessionId = await knex('meals')
      .select('*')
      .where('user_session_id', sessionId)

    return res.send(mealsBySessionId)
  })

  app.get('/summary', { preHandler: checkSessionId }, async (req, res) => {
    const [dietIn] = await knex('meals')
      .where('in_diet', true)
      .count('in_diet as diet')
    const allMeals = await knex('meals').select('*')
    const dietOut = allMeals.length - Number(dietIn.diet)

    const sessionId = req.cookies.sessionId

    let currentStreak = 0
    let maxStreak = 0

    // This code below was completed because of this repository: https://github.com/rafaelcmarques/daily-diet-api
    await knex('meals')
      .where('user_session_id', sessionId)
      .orderBy('eaten')
      .select('*')
      .then((meals) => {
        meals.forEach((meal) => {
          if (meal.in_diet) {
            currentStreak++
            if (currentStreak > maxStreak) {
              maxStreak = currentStreak
            }
          } else {
            currentStreak = 0
          }
        })
      })

    return res.send({
      in_diet: dietIn.diet,
      out_diet: dietOut,
      allMeals: allMeals.length,
      streak: currentStreak,
      maxCurrentStreak: maxStreak,
    })
  })

  app.get('/:id', { preHandler: checkSessionId }, async (req, res) => {
    const sessionId = req.cookies.sessionId

    const paramsIdSchema = z.object({
      id: z.string(),
    })

    const { id } = paramsIdSchema.parse(req.params)

    const mealExists = await knex('meals').select('*').where({
      user_session_id: sessionId,
      id,
    })

    if (mealExists.length === 0) {
      return res.status(404).send('Meal not found, please try again!')
    }

    return res.send(mealExists)
  })

  app.post('/create', { preHandler: checkSessionId }, async (req, res) => {
    const sessionId = req.cookies.sessionId

    const bodyMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      inDiet: z.boolean(),
      eaten: z.string(),
    })

    const { name, description, inDiet, eaten } = bodyMealSchema.parse(req.body)

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      eaten,
      in_diet: inDiet,
      user_session_id: sessionId,
    })

    return res.status(201).send()
  })

  app.put('/edit/:id', { preHandler: checkSessionId }, async (req, res) => {
    const paramsIdSchema = z.object({
      id: z.string(),
    })

    const bodySchema = z.object({
      name: z.string().nullish(),
      description: z.string().nullish(),
      inDiet: z.boolean().nullish(),
      eaten: z.string().nullish(),
    })

    const { id } = paramsIdSchema.parse(req.params)
    const { name, description, inDiet, eaten } = bodySchema.parse(req.body)

    const sessionId = req.cookies.sessionId

    const mealExists = await knex('meals').where({
      user_session_id: sessionId,
      id,
    })

    if (mealExists.length === 0) {
      return res.status(404).send('Meal not found, please try again!')
    }

    await knex('meals').where('id', id).update({
      name,
      description,
      eaten,
      in_diet: inDiet,
    })

    return res.status(204).send()
  })

  app.delete(
    '/delete/:id',
    { preHandler: checkSessionId },
    async (req, res) => {
      const paramsIdSchema = z.object({
        id: z.string(),
      })

      const sessionId = req.cookies.sessionId

      const { id } = paramsIdSchema.parse(req.params)

      const mealExists = await knex('meals').where({
        user_session_id: sessionId,
        id,
      })

      if (mealExists.length === 0) {
        return res.status(404).send('Meal not found, please try again!')
      }

      await knex('meals').where('id', id).del()

      return res.status(204).send()
    },
  )
}

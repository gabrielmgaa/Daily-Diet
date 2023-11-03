import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { userRoutes } from './routes/user'
import { mealsRoutes } from './routes/meals'

export const app = fastify()

app.register(cookie)
app.register(mealsRoutes, {
  prefix: '/meals',
})
app.register(userRoutes, {
  prefix: '/users',
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('Server is running')
  })

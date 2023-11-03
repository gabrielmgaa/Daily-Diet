import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary().notNullable()
    table.text('name').notNullable()
    table.text('description').notNullable()
    table.text('eaten').notNullable()

    table.boolean('in_diet').notNullable()
    table.uuid('user_session_id').index().notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}

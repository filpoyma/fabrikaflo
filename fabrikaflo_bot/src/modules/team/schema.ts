import { Type } from '@sinclair/typebox'

export const TeamMemberSchema = Type.Object({
  id: Type.String(),
  name: Type.Union([Type.String(), Type.Null()]),
  username: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  role: Type.String(),
  telegramId: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.Any(),
})

export const listTeamSchema = {
  tags: ['team'],
  response: {
    200: Type.Object({
      data: Type.Array(TeamMemberSchema),
    }),
  },
}

export const createTeamSchema = {
  tags: ['team'],
  body: Type.Object({
    name: Type.String({ minLength: 1 }),
    username: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
    role: Type.Union([Type.Literal('ADMIN'), Type.Literal('COURIER')]),
    password: Type.Optional(Type.String()),
  }),
  response: {
    201: Type.Object({
      data: TeamMemberSchema,
    }),
  },
}

export const deleteTeamSchema = {
  tags: ['team'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
    }),
  },
}

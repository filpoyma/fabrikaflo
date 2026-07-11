import { Type } from '@sinclair/typebox'

export const PortfolioItemSchema = Type.Object({
  id: Type.String(),
  photoUrl: Type.String(),
  title: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.Any(),
})

export const listGallerySchema = {
  tags: ['gallery'],
  response: {
    200: Type.Object({
      data: Type.Array(PortfolioItemSchema),
    }),
  },
}

export const createGallerySchema = {
  tags: ['gallery'],
  response: {
    201: Type.Object({
      data: PortfolioItemSchema,
    }),
  },
}

export const deleteGallerySchema = {
  tags: ['gallery'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
    }),
  },
}

export const updateGallerySchema = {
  tags: ['gallery'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: PortfolioItemSchema,
    }),
  },
}

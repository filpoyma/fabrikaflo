import type { FastifyRequest, FastifyReply } from 'fastify'
import { createGalleryService } from './service.ts'

export async function listGallery(request: FastifyRequest, _reply: FastifyReply) {
  const service = createGalleryService(request.server)
  const data = await service.getAll()
  return { data }
}

export async function createGalleryItem(request: FastifyRequest, reply: FastifyReply) {
  const parts = request.parts()
  let fileBuffer: Buffer | null = null
  let title = ''
  let description = ''

  for await (const part of parts) {
    if (part.type === 'file') {
      fileBuffer = await part.toBuffer()
    } else {
      // Process text fields
      if (part.fieldname === 'title') {
        title = part.value as string
      } else if (part.fieldname === 'description') {
        description = part.value as string
      }
    }
  }

  if (!fileBuffer) {
    return reply.badRequest('No file uploaded')
  }

  const service = createGalleryService(request.server)

  // Upload to Cloudinary
  const photoUrl = await request.server.cloudinary.uploadBuffer(fileBuffer, 'fabrikaflo_portfolio')
  const data = await service.createItem(photoUrl, title, description)

  return reply.code(201).send({ data })
}

export async function deleteGalleryItem(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createGalleryService(request.server)
  return service.deleteItem(request.params.id)
}

export async function updateGalleryItem(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const parts = request.parts()
  let fileBuffer: Buffer | null = null
  let title: string | undefined = undefined
  let description: string | undefined = undefined

  for await (const part of parts) {
    if (part.type === 'file') {
      if (part.filename) {
        fileBuffer = await part.toBuffer()
      }
    } else {
      if (part.fieldname === 'title') {
        title = part.value as string
      } else if (part.fieldname === 'description') {
        description = part.value as string
      }
    }
  }

  const service = createGalleryService(request.server)
  let photoUrl: string | undefined = undefined

  if (fileBuffer && fileBuffer.length > 0) {
    photoUrl = await request.server.cloudinary.uploadBuffer(fileBuffer, 'fabrikaflo_portfolio')
  }

  const data = await service.updateItem(request.params.id, title, description, photoUrl)
  return { data }
}

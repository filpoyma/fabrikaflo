import fp from 'fastify-plugin'
import { v2 as cloudinary } from 'cloudinary'

declare module 'fastify' {
  interface FastifyInstance {
    cloudinary: {
      uploadBuffer: (buffer: Buffer, folder?: string) => Promise<string>
      uploadStream: (stream: any, folder?: string) => Promise<string>
      uploadUrlOrPath: (urlOrPath: string, folder?: string) => Promise<string>
    }
  }
}

export default fp(
  async function cloudinaryPlugin(fastify) {
    const cloudName = fastify.config.CLOUDINARY_CLOUD_NAME
    const apiKey = fastify.config.CLOUDINARY_API_KEY
    const apiSecret = fastify.config.CLOUDINARY_API_SECRET

    const isConfigured = cloudName && apiKey && apiSecret

    if (!isConfigured) {
      fastify.log.warn(
        'Cloudinary credentials are not fully configured in env. File uploads will return placeholder URLs.'
      )

      fastify.decorate('cloudinary', {
        async uploadBuffer(buffer: Buffer, _folder = 'fabrikaflo') {
          fastify.log.info('[Mock Cloudinary] uploadBuffer received file of size %d bytes', buffer.length)
          // Return a beautiful unsplash flower photo as placeholder
          return 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=800&auto=format&fit=crop'
        },
        async uploadStream(stream: any, _folder = 'fabrikaflo') {
          fastify.log.info('[Mock Cloudinary] uploadStream received stream')
          return 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop'
        },
        async uploadUrlOrPath(urlOrPath: string, _folder = 'fabrikaflo') {
          fastify.log.info('[Mock Cloudinary] uploadUrlOrPath received %s', urlOrPath)
          return urlOrPath.startsWith('http')
            ? urlOrPath
            : 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=800&auto=format&fit=crop'
        },
      })
      return
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    fastify.decorate('cloudinary', {
      uploadBuffer(buffer: Buffer, folder = 'fabrikaflo'): Promise<string> {
        return new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
              if (error) reject(error)
              else if (result?.secure_url) resolve(result.secure_url)
              else reject(new Error('Cloudinary upload returned empty result'))
            }
          )
          upload.end(buffer)
        })
      },
      uploadStream(stream: any, folder = 'fabrikaflo'): Promise<string> {
        return new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
              if (error) reject(error)
              else if (result?.secure_url) resolve(result.secure_url)
              else reject(new Error('Cloudinary upload returned empty result'))
            }
          )
          stream.pipe(upload)
        })
      },
      uploadUrlOrPath(urlOrPath: string, folder = 'fabrikaflo'): Promise<string> {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            urlOrPath,
            { folder },
            (error, result) => {
              if (error) reject(error)
              else if (result?.secure_url) resolve(result.secure_url)
              else reject(new Error('Cloudinary upload returned empty result'))
            }
          )
        })
      },
    })
  },
  { name: 'cloudinary', dependencies: ['env'] },
)

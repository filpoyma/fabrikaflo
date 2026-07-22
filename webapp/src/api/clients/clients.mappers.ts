import type { IClientProfile } from '../../types/webapp.ts'

export interface IApiUserProfile {
  id: string
  name?: string | null
  phone?: string | null
  tgname?: string | null
  avatarUrl?: string | null
  address?: string | null
  role?: string
}

export function mapProfileFromApi(user: IApiUserProfile): IClientProfile {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    tgname: user.tgname,
    photo_url: user.avatarUrl ?? null,
    address: user.address ?? null,
    role: user.role,
  }
}

export function mapProfileToApi(data: Partial<IClientProfile>) {
  const payload: {
    name?: string
    phone?: string
    avatarUrl?: string
    address?: string
  } = {}

  if (data.name !== undefined) payload.name = data.name ?? undefined
  if (data.phone !== undefined) payload.phone = data.phone ?? undefined
  if (data.photo_url !== undefined) payload.avatarUrl = data.photo_url ?? undefined
  if (data.address !== undefined) payload.address = data.address ?? undefined

  return payload
}

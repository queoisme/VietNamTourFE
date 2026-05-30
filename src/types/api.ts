export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: string[]
  meta?: PaginatedMeta
}

export interface PaginatedMeta {
  page: number
  size: number
  total: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginatedMeta
}

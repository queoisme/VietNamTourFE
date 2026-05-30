import api from './client'
import { HomeCategory } from '@/types/admin'

export async function getHomeCategories(): Promise<HomeCategory[]> {
  const res = await api.get('/home/categories')
  return res.data
}

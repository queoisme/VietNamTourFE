import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'
import { UserProfile } from '@/types/user'

interface AuthStore {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  setAuth: (user: UserProfile, session: Session) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setAuth: (user, session) => set({ user, session, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, session: null, isLoading: false }),
}))

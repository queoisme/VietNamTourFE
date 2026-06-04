import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getMe, updateMe } from '@/api/users'
import { registerUser } from '@/api/auth'
import { UserProfile } from '@/types/user'

// Keep interface compatible with existing page code
export interface User {
  id: string
  email: string
  name: string
  role: 'guide' | 'customer' | 'admin'
  avatar?: string
  phone?: string
  isVerified?: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  login: (email: string, password: string) => Promise<UserProfile>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, name: string, role?: 'guide' | 'customer') => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone'>>) => Promise<void>
  refreshProfile: () => Promise<void>
  isAuthenticated: boolean
  isGuide: boolean
  isAdmin: boolean
  isLoading: boolean
  showVerifyModal: boolean
  setShowVerifyModal: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function profileToUser(p: UserProfile): User {
  return {
    id: p.id,
    email: p.email,
    name: p.fullName,
    role: p.role,
    avatar: p.avatarUrl ?? undefined,
    phone: p.phone ?? undefined,
    isVerified: p.isVerified,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      const p = await getMe()
      if (p.isBanned) {
        supabase.auth.signOut()
        return
      }
      setProfile(p)
      setUser(profileToUser(p))
    } catch {
      setProfile(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        loadProfile().finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile()
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const p = await getMe()
    if (p.isBanned) {
      await supabase.auth.signOut()
      sessionStorage.setItem('auth_redirect_message', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')
      throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')
    }
    setProfile(p)
    setUser(profileToUser(p))
    return p
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }

  const register = async (email: string, password: string, name: string) => {
    await registerUser({ email, password, fullName: name })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.replace('/')
  }

  const updateProfile = async (data: Partial<Pick<User, 'name' | 'phone'>>) => {
    const payload: { fullName?: string; phone?: string } = {}
    if (data.name) payload.fullName = data.name
    if (data.phone) payload.phone = data.phone
    const updated = await updateMe(payload)
    setProfile(updated)
    setUser(profileToUser(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        refreshProfile: loadProfile,
        isAuthenticated: !!user,
        isGuide: user?.role === 'guide',
        isAdmin: user?.role === 'admin',
        isLoading,
        showVerifyModal,
        setShowVerifyModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

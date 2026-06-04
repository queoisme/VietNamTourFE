import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes.tsx'
import { Toaster } from './components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
import { Maintenance } from './pages/Maintenance'
import { getMaintenanceMode } from '@/api/siteConfig'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)

  useEffect(() => {
    if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
      setMaintenanceMode(true)
      return
    }

    getMaintenanceMode()
      .then(async (enabled) => {
        if (enabled) {
          const { data } = await supabase.auth.getSession()
          const role = data.session?.user?.app_metadata?.role
          if (role === 'admin') {
            setMaintenanceMode(false)
            return
          }
        }
        setMaintenanceMode(enabled)
      })
      .catch(() => setMaintenanceMode(false))
  }, [])

  if (maintenanceMode === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (maintenanceMode === true && !window.location.pathname.startsWith('/admin')) {
    return <Maintenance />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}

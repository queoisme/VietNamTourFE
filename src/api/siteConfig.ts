import { supabase } from '@/lib/supabase'

async function updateConfig(key: string, value: string): Promise<void> {
  const { data, error } = await supabase
    .from('site_config')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Không có quyền cập nhật. Vui lòng kiểm tra lại tài khoản admin.')
}

export async function getMaintenanceMode(): Promise<boolean> {
  const { data, error } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()
  if (error) throw new Error(error.message)
  return data.value === 'true'
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await updateConfig('maintenance_mode', String(enabled))
}

export interface MaintenanceConfig {
  endTime: string
  durationMinutes: number
}

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  const { data, error } = await supabase
    .from('site_config')
    .select('key, value')
    .in('key', ['maintenance_end_time', 'maintenance_countdown_minutes'])
  if (error) throw new Error(error.message)
  const endTime = data?.find(r => r.key === 'maintenance_end_time')?.value ?? ''
  const durationMinutes = parseInt(data?.find(r => r.key === 'maintenance_countdown_minutes')?.value ?? '120')
  return { endTime, durationMinutes }
}

export async function setMaintenanceCountdown(durationMinutes: number): Promise<void> {
  const endTime = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
  await Promise.all([
    updateConfig('maintenance_end_time', endTime),
    updateConfig('maintenance_countdown_minutes', String(durationMinutes)),
  ])
}

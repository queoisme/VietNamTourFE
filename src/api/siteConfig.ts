import { supabase } from '@/lib/supabase'

const CONFIG_KEY = 'maintenance_mode'

export async function getMaintenanceMode(): Promise<boolean> {
  const { data, error } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single()
  if (error) throw new Error(error.message)
  return data.value === 'true'
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('site_config')
    .update({ value: String(enabled), updated_at: new Date().toISOString() })
    .eq('key', CONFIG_KEY)
    .select()
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Không có quyền cập nhật. Vui lòng kiểm tra lại tài khoản admin.')
}

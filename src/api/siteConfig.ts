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
  const { error } = await supabase
    .from('site_config')
    .update({ value: String(enabled), updated_at: new Date().toISOString() })
    .eq('key', CONFIG_KEY)
  if (error) throw new Error(error.message)
}

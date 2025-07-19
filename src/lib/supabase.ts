import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para verificar empleado
export const verifyEmployee = async (cedula: string) => {
  const { data, error } = await supabase
    .rpc('verify_employee', { input_cedula: cedula })

  if (error) {
    console.error('Error verifying employee:', error)
    return { data: null, error: error.message }
  }

  return { data: data?.[0] || null, error: null }
}

// Función para obtener empleados para invitar
export const getEmployeesForInvite = async (currentUserCedula?: string) => {
  const { data, error } = await supabase
    .rpc('get_employees_for_invite', { 
      current_user_cedula: currentUserCedula || null 
    })

  if (error) {
    console.error('Error getting employees:', error)
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Employee, AuthState } from '@/types'
import { verifyEmployee } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  login: (cedula: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    employee: null,
    loading: true,
    error: null
  })

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const savedEmployee = localStorage.getItem('sirius_employee')
    if (savedEmployee) {
      try {
        const employee = JSON.parse(savedEmployee)
        setAuthState({
          isAuthenticated: true,
          employee,
          loading: false,
          error: null
        })
      } catch {
        localStorage.removeItem('sirius_employee')
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    } else {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const login = async (cedula: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await verifyEmployee(cedula)
      
      if (error || !data) {
        setAuthState({
          isAuthenticated: false,
          employee: null,
          loading: false,
          error: 'Cédula no encontrada o empleado inactivo'
        })
        return false
      }

      const employee: Employee = {
        id: data.id,
        cedula: data.cedula,
        first_name: data.first_name,
        last_name: data.last_name,
        department: data.department,
        email: data.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        is_active: data.is_active,
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      }

      // Guardar en localStorage
      localStorage.setItem('sirius_employee', JSON.stringify(employee))

      setAuthState({
        isAuthenticated: true,
        employee,
        loading: false,
        error: null
      })

      return true
    } catch (err) {
      console.error('Authentication error:', err)
      setAuthState({
        isAuthenticated: false,
        employee: null,
        loading: false,
        error: 'Error de conexión. Intenta nuevamente.'
      })
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('sirius_employee')
    setAuthState({
      isAuthenticated: false,
      employee: null,
      loading: false,
      error: null
    })
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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

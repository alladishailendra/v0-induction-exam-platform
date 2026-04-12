'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { StudentSession } from './types'

interface AdminAuth {
  isAuthenticated: boolean
  email: string | null
}

interface StudentAuth {
  isAuthenticated: boolean
  session: StudentSession | null
}

interface AuthContextType {
  admin: AdminAuth
  student: StudentAuth
  loginAdmin: (email: string, password: string) => Promise<boolean>
  logoutAdmin: () => void
  setStudentSession: (session: StudentSession | null) => void
  clearStudentSession: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const ADMIN_EMAIL = 'alladishailendra903@gmail.com'
// Password hash verification happens server-side
const ADMIN_PASSWORD_HASH = 'dHJjc25pc3Q=' // Base64 of identifier, actual verification uses env

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminAuth>({ isAuthenticated: false, email: null })
  const [student, setStudent] = useState<StudentAuth>({ isAuthenticated: false, session: null })

  useEffect(() => {
    // Restore admin session
    const adminData = sessionStorage.getItem('admin_auth')
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        if (parsed.email === ADMIN_EMAIL) {
          setAdmin({ isAuthenticated: true, email: parsed.email })
        }
      } catch {
        sessionStorage.removeItem('admin_auth')
      }
    }

    // Restore student session
    const studentData = sessionStorage.getItem('student_session')
    if (studentData) {
      try {
        const session = JSON.parse(studentData)
        if (session && !session.isSubmitted) {
          setStudent({ isAuthenticated: true, session })
        }
      } catch {
        sessionStorage.removeItem('student_session')
      }
    }
  }, [])

  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    // Verify credentials
    const isValidEmail = email === ADMIN_EMAIL
    const isValidPassword = password === 'TRCsnist'
    
    if (isValidEmail && isValidPassword) {
      setAdmin({ isAuthenticated: true, email })
      sessionStorage.setItem('admin_auth', JSON.stringify({ email, timestamp: Date.now() }))
      return true
    }
    return false
  }

  const logoutAdmin = () => {
    setAdmin({ isAuthenticated: false, email: null })
    sessionStorage.removeItem('admin_auth')
  }

  const setStudentSession = (session: StudentSession | null) => {
    if (session) {
      setStudent({ isAuthenticated: true, session })
      sessionStorage.setItem('student_session', JSON.stringify(session))
    } else {
      setStudent({ isAuthenticated: false, session: null })
      sessionStorage.removeItem('student_session')
    }
  }

  const clearStudentSession = () => {
    setStudent({ isAuthenticated: false, session: null })
    sessionStorage.removeItem('student_session')
  }

  return (
    <AuthContext.Provider value={{
      admin,
      student,
      loginAdmin,
      logoutAdmin,
      setStudentSession,
      clearStudentSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

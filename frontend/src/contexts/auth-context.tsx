"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { User, LoginCredentials, RegisterData } from "@/types"
import { api } from "@/services/api"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem("access_token")
    if (storedToken) {
      setToken(storedToken)
      loadUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const { user: userData } = await api.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Failed to load user:", error)
      setToken(null)
      localStorage.removeItem("access_token")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.login(credentials)
      setToken(response.access_token)
      setUser(response.user)
      localStorage.setItem("access_token", response.access_token)
      toast.success("Login successful!")
      router.push("/dashboard")
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Login failed"
      toast.error(message)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data)
      setToken(response.access_token)
      setUser(response.user)
      localStorage.setItem("access_token", response.access_token)
      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Registration failed"
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("access_token")
    toast.success("Logged out successfully")
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export default AuthContext


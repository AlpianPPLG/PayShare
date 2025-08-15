"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { AuthUser, LoginCredentials, RegisterData, ApiResponse } from "../types"

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      fetchProfile(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data: ApiResponse = await response.json()

      if (data.success && data.data?.user) {
        setUser(data.data.user)
      } else {
        localStorage.removeItem("auth_token")
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      localStorage.removeItem("auth_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data: ApiResponse = await response.json()

      if (data.success && data.data?.user && data.data?.token) {
        setUser(data.data.user)
        localStorage.setItem("auth_token", data.data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || "Login failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      })

      const data: ApiResponse = await response.json()

      if (data.success && data.data?.user && data.data?.token) {
        setUser(data.data.user)
        localStorage.setItem("auth_token", data.data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || "Registration failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
  }

  const updateProfile = async (profileData: { name: string; phone?: string }) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return { success: false, error: "Not authenticated" }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      const data: ApiResponse = await response.json()

      if (data.success && data.data?.user) {
        setUser(data.data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || "Update failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

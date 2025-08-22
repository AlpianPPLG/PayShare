/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n/useI18n"

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState({
    totalOwed: 0,
    totalOwes: 0,
    activeGroups: 0,
    recentExpenses: 0,
  })

  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("No authentication token found")
          setLoading(false)
          return
        }

        const response = await fetch("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
          setActivities(data.data.activities)
        } else {
          setError(data.error || "Failed to load dashboard data")
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        setError("Network error")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("dashboard.welcome", { name: user?.name || "" })}</h1>
            <p className="text-muted-foreground">{t("dashboard.overviewSub")}</p>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <StatsCards stats={stats} />
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              {loading ? <Skeleton className="h-96" /> : <RecentActivity activities={activities} />}
            </div>

            {/* Quick Actions */}
            <div>{loading ? <Skeleton className="h-96" /> : <QuickActions />}</div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

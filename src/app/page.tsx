"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOwed: 0,
    totalOwes: 0,
    activeGroups: 0,
    recentExpenses: 0,
  })
  // Import the Activity type from the component that uses it
  interface Activity {
    id: number;
    type: 'expense' | 'settlement' | 'group';
    title: string;
    description: string;
    amount?: number;
    user: {
      name: string;
      avatar_url?: string;
    };
    created_at: Date;
    status?: 'pending' | 'completed';
    // Additional fields that might be used by specific activity types
    expense_id?: number;
    expense_title?: string;
  }

  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Simulate loading dashboard data
    // In a real app, you would fetch this from your API
    const loadDashboardData = async () => {
      // Mock data for demonstration
      setTimeout(() => {
        setStats({
          totalOwed: 250000,
          totalOwes: 150000,
          activeGroups: 3,
          recentExpenses: 12,
        })

        setActivities([
          {
            id: 1,
            type: "expense",
            title: "Dinner at Restaurant",
            description: "Split with 3 friends",
            amount: 120000,
            user: { name: "John Doe" },
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            status: "pending",
            expense_id: 1,
            expense_title: "Dinner at Restaurant",
          },
          {
            id: 2,
            type: "settlement",
            title: "Payment received",
            description: "Jane paid you back for groceries",
            amount: 75000,
            user: { name: "Jane Smith" },
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            status: "completed",
          },
          {
            id: 3,
            type: "group" as const,
            title: "Joined Weekend Trip group",
            description: "Added to group by Bob Wilson",
            amount: undefined, // Not needed for group type
            user: { 
              name: "Bob Wilson",
              avatar_url: undefined 
            },
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            status: undefined, // Not needed for group type
          },
        ])

        setLoading(false)
      }, 1000)
    }

    loadDashboardData()
  }, [])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">Heres an overview of your shared expenses and balances.</p>
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

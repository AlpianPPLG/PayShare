"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Receipt, Plus, Eye, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ExpenseWithDetails } from "@/lib/types"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "food_&_dining": "🍽️",
      transportation: "🚗",
      entertainment: "🎬",
      shopping: "🛍️",
      utilities: "💡",
      travel: "✈️",
      healthcare: "🏥",
      general: "📝",
    }
    return icons[category] || "📝"
  }

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setExpenses(data.data.expenses)
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-600">Track and manage your shared expenses</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/expenses/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </Button>
          </div>

          {/* Expenses List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                <p className="text-muted-foreground mb-4">Start by creating your first shared expense.</p>
                <Button asChild>
                  <Link href="/dashboard/expenses/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-2xl">{getCategoryIcon(expense.category)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{expense.title}</h3>
                            {expense.group_name && (
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {expense.group_name}
                              </Badge>
                            )}
                          </div>

                          {expense.description && <p className="text-muted-foreground mb-3">{expense.description}</p>}

                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src="/placeholder.svg" />
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(expense.paid_by_name)}
                                </AvatarFallback>
                              </Avatar>
                              Paid by {expense.paid_by_name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDistanceToNow(new Date(expense.expense_date), { addSuffix: true })}
                            </div>
                            <div>
                              {expense.participants.length} participant{expense.participants.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {formatCurrency(expense.total_amount)}
                        </div>
                        <div className="flex space-x-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/expenses/${expense.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

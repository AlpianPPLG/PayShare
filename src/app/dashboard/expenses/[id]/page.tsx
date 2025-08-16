"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Receipt, 
  Calendar, 
  Users, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download,
  Share2,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ExpenseWithDetails } from "@/lib/types"

export default function ExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const expenseId = Number.parseInt(params.id as string)
  const [expense, setExpense] = useState<ExpenseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  const fetchExpense = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/expenses/${expenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setExpense(data.data.expense)
      } else {
        setError(data.error || "Failed to load expense")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        router.push("/dashboard/expenses")
      } else {
        setError(data.error || "Failed to delete expense")
      }
    } catch (error) {
      setError("Network error")
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export expense:", expense)
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share expense:", expense)
  }

  useEffect(() => {
    if (expenseId) {
      fetchExpense()
    }
  }, [expenseId])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Skeleton className="h-96" />
              </div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !expense) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/expenses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Expenses
              </Link>
            </Button>
            <Alert variant="destructive">
              <AlertDescription>{error || "Expense not found"}</AlertDescription>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/expenses">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Expenses
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <span className="text-2xl mr-3">{getCategoryIcon(expense.category)}</span>
                  {expense.title}
                </h1>
                <p className="text-gray-600">{expense.description}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Expense Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(expense.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Split Method</p>
                      <Badge variant="outline" className="capitalize">
                        {expense.split_method} Split
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">
                        {expense.category.replace(/_/g, " ").replace(/&/g, "&")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Currency</p>
                      <p className="font-medium">{expense.currency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Participants ({expense.participants.length})
                  </CardTitle>
                  <CardDescription>How the expense is split among participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expense.participants.map((participant) => (
                      <div key={participant.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>{getUserInitials(participant.user_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.user_name}</p>
                            <p className="text-sm text-muted-foreground">{participant.user_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(participant.amount_owed)}</p>
                          {participant.percentage && (
                            <p className="text-sm text-muted-foreground">{participant.percentage}%</p>
                          )}
                          <div className="mt-1">
                            <Badge variant={participant.is_settled ? "default" : "secondary"} className="mb-1">
                              {participant.is_settled ? "Settled" : "Pending"}
                            </Badge>
                            {!participant.is_settled && participant.amount_owed > 0 && (
                              <Button variant="outline" size="sm" className="ml-2" asChild>
                                <Link href={`/dashboard/settlements/new?expense=${expense.id}&participant=${participant.user_id}`}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Record
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Split</span>
                    <span>{formatCurrency(expense.participants.reduce((sum, p) => sum + p.amount_owed, 0))}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Expense Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paid by</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-xs">{getUserInitials(expense.paid_by_name)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{expense.paid_by_name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <p>{new Date(expense.expense_date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(expense.expense_date), { addSuffix: true })}
                    </p>
                  </div>

                  {expense.group_name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Group</p>
                      <Badge variant="secondary" className="mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        {expense.group_name}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/settlements/new?expense=${expense.id}`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Settlement
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/dashboard/expenses/new?duplicate=${expense.id}`}>
                      <Receipt className="h-4 w-4 mr-2" />
                      Duplicate Expense
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
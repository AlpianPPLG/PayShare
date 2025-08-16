"use client"

import { useEffect, useState, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ExpenseFilters } from "@/components/expenses/expense-filters"
import { QuickSplitDialog } from "@/components/expenses/quick-split-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Receipt, Plus, Eye, Calendar, Users, Filter, Download } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ExpenseWithDetails, Category } from "@/lib/types"
import { toast } from "sonner"
import { Select } from "react-day-picker"

interface FilterState {
  search: string
  groupId: string
  category: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
  sortBy: string
  sortOrder: "asc" | "desc"
  status: string
}

interface Participant {
  id: string
  is_settled: boolean
  // Add other participant fields as needed
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithDetails[]>([])
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx")
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    groupId: "",
    category: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "expense_date",
    sortOrder: "desc",
    status: "",
  })

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
        setFilteredExpenses(data.data.expenses)
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      console.log(`Starting ${exportFormat.toUpperCase()} export...`)
      setIsExporting(true)

      const response = await fetch(`/api/expenses/export?format=${exportFormat}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:
            exportFormat === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv",
        },
      })

      console.log("Export response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Export API error:", errorText)
        throw new Error(`Failed to export: ${response.status} ${response.statusText}`)
      }

      // Get the filename from the Content-Disposition header or use a default one
      const contentDisposition = response.headers.get("Content-Disposition")
      const extension = exportFormat === "xlsx" ? "xlsx" : "csv"
      let filename = `expenses_${new Date().toISOString().split("T")[0]}.${extension}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()

      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Exported to ${filename}`)
      console.log(`Export to ${exportFormat.toUpperCase()} completed successfully`)
    } catch (error) {
      console.error("Export failed:", error)
      toast.error(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsExporting(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/groups", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setGroups(data.data.groups)
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCategories(data.data.categories)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const applyFilters = (newFilters: Partial<FilterState>) => {
    const mergedFilters = { ...filters, ...newFilters }
    setFilters(mergedFilters)

    let filtered = [...expenses]

    // Search filter
    if (mergedFilters.search) {
      const searchLower = mergedFilters.search.toLowerCase()
      filtered = filtered.filter(
        (expense) =>
          expense.title.toLowerCase().includes(searchLower) ||
          (expense.description?.toLowerCase() || "").includes(searchLower) ||
          (expense.paid_by_name || "").toLowerCase().includes(searchLower),
      )
    }

    // Category filter
    if (mergedFilters.category && mergedFilters.category !== "all") {
      filtered = filtered.filter((expense) => expense.category === mergedFilters.category)
    }

    // Date range filter with proper null checks
    if (mergedFilters.startDate) {
      const startDate = new Date(mergedFilters.startDate)
      if (!isNaN(startDate.getTime())) {
        filtered = filtered.filter((expense) => new Date(expense.expense_date) >= startDate)
      }
    }
    if (mergedFilters.endDate) {
      const endDate = new Date(mergedFilters.endDate)
      if (!isNaN(endDate.getTime())) {
        filtered = filtered.filter((expense) => new Date(expense.expense_date) <= endDate)
      }
    }

    // Group filter
    if (mergedFilters.groupId) {
      if (mergedFilters.groupId === "no-group") {
        filtered = filtered.filter((expense) => !expense.group_id)
      } else {
        filtered = filtered.filter((expense) => expense.group_id?.toString() === mergedFilters.groupId)
      }
    }

    // Status filter
    if (mergedFilters.status) {
      filtered = filtered.filter((expense) => {
        const settledCount = expense.participants.filter((p) => p.is_settled).length
        const totalCount = expense.participants.length

        switch (mergedFilters.status) {
          case "settled":
            return settledCount === totalCount
          case "partial":
            return settledCount > 0 && settledCount < totalCount
          case "pending":
            return settledCount === 0
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (mergedFilters.sortBy) {
        case "expense_date":
          aValue = new Date(a.expense_date)
          bValue = new Date(b.expense_date)
          break
        case "total_amount":
          aValue = a.total_amount
          bValue = b.total_amount
          break
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "created_at":
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = new Date(a.expense_date)
          bValue = new Date(b.expense_date)
      }

      if (mergedFilters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredExpenses(filtered)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token")

        // Fetch expenses
        const expensesResponse = await fetch("/api/expenses", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const expensesData = await expensesResponse.json()
        if (expensesData.success) {
          setExpenses(expensesData.data.expenses)
          setFilteredExpenses(expensesData.data.expenses)
        }

        // Fetch groups
        const groupsResponse = await fetch("/api/groups", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const groupsData = await groupsResponse.json()
        if (groupsData.success) {
          setGroups(groupsData.data.groups)
        }

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const categoriesData = await categoriesResponse.json()
        if (categoriesData.success) {
          setCategories(categoriesData.data.categories)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip the initial mount and only run when expenses change
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    // Only apply filters when expenses change, not when filters change
    applyFilters({})
  }, [expenses])

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
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex items-center space-x-2">
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as "xlsx" | "csv")}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isExporting}
                >
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={filteredExpenses.length === 0 || isExporting}
                >
                  {isExporting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </div>
              <QuickSplitDialog onExpenseCreated={fetchExpenses} />
              <Button asChild>
                <Link href="/dashboard/expenses/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="lg:col-span-1">
                <ExpenseFilters onFiltersChange={applyFilters} groups={groups} categories={categories} />
              </div>
            )}

            {/* Main Content */}
            <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{filteredExpenses.length}</div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.total_amount, 0))}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {filteredExpenses.reduce((sum, e) => sum + e.participants.length, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses List */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : filteredExpenses.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {expenses.length === 0 ? "No expenses yet" : "No expenses match your filters"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {expenses.length === 0
                        ? "Start by creating your first shared expense."
                        : "Try adjusting your filters or create a new expense."}
                    </p>
                    <div className="flex justify-center space-x-2">
                      <QuickSplitDialog onExpenseCreated={fetchExpenses} />
                      <Button asChild variant="outline">
                        <Link href="/dashboard/expenses/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Expense
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
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
                                {/* Settlement Status Badge */}
                                {(() => {
                                  const settledCount = expense.participants.filter((p) => p.is_settled).length
                                  const totalCount = expense.participants.length

                                  if (settledCount === totalCount) {
                                    return <Badge variant="default">Settled</Badge>
                                  } else if (settledCount > 0) {
                                    return <Badge variant="outline">Partial</Badge>
                                  } else {
                                    return <Badge variant="secondary">Pending</Badge>
                                  }
                                })()}
                              </div>

                              {expense.description && (
                                <p className="text-muted-foreground mb-3">{expense.description}</p>
                              )}

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
                                  {expense.participants.length} participant
                                  {expense.participants.length !== 1 ? "s" : ""}
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
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreateExpenseForm } from "@/components/expenses/create-expense-form"

export default function EditExpensePage() {
  const params = useParams()
  const router = useRouter()
  const expenseId = Number.parseInt(params.id as string)
  const [expense, setExpense] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const response = await fetch(`/api/expenses/${expenseId}`, {
          headers: { Authorization: `Bearer ${token}` },
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

    if (expenseId) {
      fetchExpense()
    }
  }, [expenseId])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href={`/dashboard/expenses/${expenseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Expense
              </Link>
            </Button>
            <div>Loading expense details...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !expense) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/expenses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Expenses
              </Link>
            </Button>
            <div className="text-red-500">{error || "Expense not found"}</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href={`/dashboard/expenses/${expenseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Expense
              </Link>
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold">Edit Expense</h1>
          
          <CreateExpenseForm 
            isEditMode={true}
            initialData={{
              id: expense.id,
              title: expense.title,
              description: expense.description,
              totalAmount: expense.total_amount.toString(),
              category: expense.category || "general", // Ensure default category
              groupId: expense.group_id ? expense.group_id.toString() : "",
              paidBy: expense.paid_by?.toString() || "",
              splitMethod: expense.split_method || "equal",
              expenseDate: new Date(expense.expense_date).toISOString().split("T")[0],
              participants: expense.participants?.map((p: any) => ({
                user_id: p.user_id,
                user_name: p.user_name || `User ${p.user_id}`,
                amount: p.amount_owed,
                percentage: p.percentage
              })) || []
            }}
            onSuccess={() => router.push(`/dashboard/expenses/${expenseId}`)}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CreateExpenseForm } from "@/components/expenses/create-expense-form"

export default function NewExpensePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CreateExpenseForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useI18n } from "@/lib/i18n/useI18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"

function NewSettlementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const expenseId = searchParams.get('expense')
  
  const [loading, setLoading] = useState(!!expenseId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [expense, setExpense] = useState<any>(null)
  const [formData, setFormData] = useState({
    amount: "",
    notes: "",
    settlement_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (expenseId) {
      fetchExpenseDetails()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId])

  const fetchExpenseDetails = async () => {
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
        // Auto-fill the amount with the first pending participant's amount
        const pendingParticipant = data.data.expense.participants.find(
          (p: any) => !p.is_settled
        )
        if (pendingParticipant) {
          setFormData(prev => ({
            ...prev,
            amount: pendingParticipant.amount_owed.toString(),
          }))
        }
      } else {
        setError(data.error || t('settlements.failedToLoadDetails'))
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError(t('settlements.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expense_id: expenseId,
          from_user_id: expense?.participants.find((p: any) => p.amount_owed > 0)?.user_id,
          to_user_id: expense?.paid_by,
          amount: Number.parseFloat(formData.amount),
          currency: "IDR",
          notes: formData.notes,
          settlement_date: formData.settlement_date,
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/dashboard/expenses/${expenseId}`)
      } else {
        setError(data.error || t('settlements.failedToRecord'))
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError(t('settlements.networkError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!expense && expenseId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/expenses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('settlements.backToExpense')}
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error || t('settlements.expenseNotFoundOrNoPermission')}
          </AlertDescription>
        </Alert>
      </div>
    )
  } 

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild>
          <Link href={expenseId ? `/dashboard/expenses/${expenseId}` : "/dashboard/expenses"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('settlements.backToExpense')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-4">{t('settlements.title')}</h1>
        <p className="text-muted-foreground">
          {t('settlements.subtitle', { expenseTitle: expense?.title || 'this expense' })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            {t('settlements.settlementDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="amount">{t('settlements.amount')}</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder={t('settlements.amountPlaceholder')}
                value={formData.amount}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="settlement_date">{t('settlements.settlementDate')}</Label>
              <Input
                id="settlement_date"
                name="settlement_date"
                type="date"
                value={formData.settlement_date}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('settlements.notes')}</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder={t('settlements.notesPlaceholder')}
                value={formData.notes}
                onChange={handleInputChange}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                {t('settlements.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settlements.recording')}
                  </>
                ) : (
                  t('settlements.recordSettlement')
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewSettlementPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          <NewSettlementContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

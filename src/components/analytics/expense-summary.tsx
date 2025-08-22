"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Receipt, CreditCard, PieChart, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"

interface ExpenseSummaryProps {
  summary: {
    expenses_paid: number
    expenses_involved: number
    total_paid: number
    total_owed: number
    recent_expenses: number
  }
  categoryData: Array<{
    category: string
    total_amount: number
    expense_count: number
  }>
  settlementStats: {
    payments_made: number
    payments_received: number
    total_paid: number
    total_received: number
  }
}

export function ExpenseSummary({ summary, categoryData, settlementStats }: ExpenseSummaryProps) {
  const { t } = useI18n()
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

  const netBalance = summary.total_paid - summary.total_owed
  const settlementNet = settlementStats.total_received - settlementStats.total_paid

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.expensesPaid')}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.expenses_paid}</div>
            <p className="text-xs text-muted-foreground">{t('analytics.total')}: {formatCurrency(summary.total_paid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.expensesInvolved')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.expenses_involved}</div>
            <p className="text-xs text-muted-foreground">{t('analytics.youOwe')}: {formatCurrency(summary.total_owed)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.netBalance')}</CardTitle>
            {netBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <p className="text-xs text-muted-foreground">{netBalance >= 0 ? t('analytics.youAreOwed') : t('analytics.youOwe')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.recentActivity')}</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recent_expenses}</div>
            <p className="text-xs text-muted-foreground">{t('analytics.last30Days')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topSpendingCategories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryData.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">{getCategoryIcon(category.category)}</div>
                    <div>
                      <p className="font-medium capitalize">
                        {category.category.replace(/_/g, " ").replace(/&/g, "&")}
                      </p>
                      <p className="text-sm text-muted-foreground">{category.expense_count} {t('analytics.expenses')}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{formatCurrency(category.total_amount)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settlement Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.settlementSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span>{t('analytics.paymentsMade')}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{settlementStats.payments_made}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(settlementStats.total_paid)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>{t('analytics.paymentsReceived')}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{settlementStats.payments_received}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(settlementStats.total_received)}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('analytics.settlementNet')}</span>
                  <div className={`font-bold ${settlementNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(Math.abs(settlementNet))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {settlementNet >= 0 ? t('analytics.netPaid') : t('analytics.netPaid')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

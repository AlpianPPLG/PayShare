"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, Receipt } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"

interface StatsCardsProps {
  stats: {
    totalOwed: number
    totalOwes: number
    activeGroups: number
    recentExpenses: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useI18n()
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("stats.youAreOwed")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalOwed)}</div>
          <p className="text-xs text-muted-foreground">{t("stats.youAreOwedSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("stats.youOwe")}</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOwes)}</div>
          <p className="text-xs text-muted-foreground">{t("stats.youOweSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("stats.activeGroups")}</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeGroups}</div>
          <p className="text-xs text-muted-foreground">{t("stats.activeGroupsSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("stats.recentExpenses")}</CardTitle>
          <Receipt className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentExpenses}</div>
          <p className="text-xs text-muted-foreground">{t("stats.recentExpensesSub")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

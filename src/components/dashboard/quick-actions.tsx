"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Receipt, CreditCard } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/useI18n"

export function QuickActions() {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("quick.title")}</CardTitle>
        <CardDescription>{t("quick.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="h-auto p-4 justify-start">
            <Link href="/dashboard/expenses/new">
              <div className="flex items-center space-x-3">
                <Receipt className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{t("quick.addExpense")}</div>
                  <div className="text-xs text-muted-foreground">{t("quick.addExpenseSub")}</div>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start bg-transparent">
            <Link href="/dashboard/groups">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{t("quick.createGroup")}</div>
                  <div className="text-xs text-muted-foreground">{t("quick.createGroupSub")}</div>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start bg-transparent">
            <Link href="/dashboard/settlements">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{t("quick.recordPayment")}</div>
                  <div className="text-xs text-muted-foreground">{t("quick.recordPaymentSub")}</div>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start bg-transparent">
            <Link href="/dashboard/analytics">
              <div className="flex items-center space-x-3">
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{t("quick.viewAnalytics")}</div>
                  <div className="text-xs text-muted-foreground">{t("quick.viewAnalyticsSub")}</div>
                </div>
              </div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

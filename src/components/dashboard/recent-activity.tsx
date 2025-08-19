"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n/useI18n"

interface Activity {
  id: number
  type: "expense" | "settlement" | "group"
  title: string
  description: string
  amount?: number
  user: {
    name: string
    avatar_url?: string
  }
  created_at: Date
  status?: "pending" | "completed"
  expense_id?: number
  expense_title?: string
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const { t } = useI18n()
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "expense":
        return "💰"
      case "settlement":
        return "💳"
      case "group":
        return "👥"
      default:
        return "📝"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activity.title")}</CardTitle>
        <CardDescription>{t("activity.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("activity.emptyTitle")}</p>
              <p className="text-sm">{t("activity.emptyHint")}</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4 flex-1">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{getUserInitials(activity.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {getActivityIcon(activity.type)} {activity.title}
                    </p>
                    {activity.amount && <p className="text-sm font-medium">{formatCurrency(activity.amount)}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                    {activity.status && (
                      <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                        {t(`status.${activity.status}`)}
                      </Badge>
                    )}
                  </div>
                </div>
                </div>
                {activity.type === "expense" && activity.expense_id && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/expenses/${activity.expense_id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      {t("common.view")}
                    </Link>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

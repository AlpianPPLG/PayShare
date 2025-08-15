"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import type { UserBalance } from "@/lib/types"

interface BalanceOverviewProps {
  balances: UserBalance[]
  debts: Array<{
    from_user_id: number
    from_user_name: string
    to_user_id: number
    to_user_name: string
    amount: number
  }>
  onRecordPayment: () => void
}

export function BalanceOverview({ balances, debts, onRecordPayment }: BalanceOverviewProps) {
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

  const totalOwed = balances.reduce((sum, b) => sum + b.total_owed, 0)
  const totalOwes = balances.reduce((sum, b) => sum + b.total_owes, 0)
  const netBalance = totalOwed - totalOwes

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You are owed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalOwed)}</div>
            <p className="text-xs text-muted-foreground">Money coming to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You owe</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOwes)}</div>
            <p className="text-xs text-muted-foreground">Money you need to pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? "Overall, you are owed" : "Overall, you owe"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Balances */}
      {balances.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Balance Details</CardTitle>
            <CardDescription>Your financial relationships with other users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {balances.map((balance) => (
                <div key={balance.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{getUserInitials(balance.user_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{balance.user_name}</p>
                      <p className="text-sm text-muted-foreground">{balance.user_email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {balance.net_balance > 0 ? (
                      <div>
                        <Badge variant="destructive" className="mb-1">
                          You owe {formatCurrency(balance.total_owes)}
                        </Badge>
                        <p className="text-xs text-muted-foreground">to {balance.user_name}</p>
                      </div>
                    ) : (
                      <div>
                        <Badge variant="default" className="mb-1">
                          {balance.user_name} owes you {formatCurrency(balance.total_owed)}
                        </Badge>
                        <p className="text-xs text-muted-foreground">You are owed</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No outstanding balances</p>
            <p className="text-sm text-muted-foreground">All debts are settled!</p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Settlements */}
      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Suggested Settlements</CardTitle>
                <CardDescription>Recommended payments to settle debts</CardDescription>
              </div>
              <Button onClick={onRecordPayment}>Record Payment</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debts.slice(0, 5).map((debt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xs">{getUserInitials(debt.from_user_name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{debt.from_user_name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xs">{getUserInitials(debt.to_user_name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{debt.to_user_name}</span>
                  </div>
                  <Badge variant="outline">{formatCurrency(debt.amount)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

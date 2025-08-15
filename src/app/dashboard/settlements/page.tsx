"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { RecordSettlementDialog } from "@/components/settlements/record-settlement-dialog"
import { BalanceOverview } from "@/components/settlements/balance-overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Calendar, ArrowRight, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Settlement, UserBalance } from "@/lib/types"

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [debts, setDebts] = useState<
    Array<{
      from_user_id: number
      from_user_name: string
      to_user_id: number
      to_user_name: string
      amount: number
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [showRecordDialog, setShowRecordDialog] = useState(false)

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

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")

      // Fetch settlements
      const settlementsResponse = await fetch("/api/settlements", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const settlementsData = await settlementsResponse.json()
      if (settlementsData.success) {
        setSettlements(settlementsData.data.settlements)
      }

      // Fetch balances
      const balancesResponse = await fetch("/api/balances", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const balancesData = await balancesResponse.json()
      if (balancesData.success) {
        setBalances(balancesData.data.balances)
        setDebts(balancesData.data.debts)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const recalculateBalances = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      await fetch("/api/balances?action=recalculate", {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (error) {
      console.error("Failed to recalculate balances:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settlements</h1>
              <p className="text-gray-600">Track payments and settle debts</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={recalculateBalances}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate
              </Button>
              <RecordSettlementDialog balances={balances} onSettlementRecorded={fetchData} />
            </div>
          </div>

          <Tabs defaultValue="balances" className="space-y-6">
            <TabsList>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="history">Settlement History</TabsTrigger>
            </TabsList>

            <TabsContent value="balances">
              {loading ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                  <Skeleton className="h-96" />
                </div>
              ) : (
                <BalanceOverview balances={balances} debts={debts} onRecordPayment={() => setShowRecordDialog(true)} />
              )}
            </TabsContent>

            <TabsContent value="history">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : settlements.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No settlements yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Record your first payment to start tracking settlements.
                    </p>
                    <RecordSettlementDialog balances={balances} onSettlementRecorded={fetchData} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Settlement History</CardTitle>
                    <CardDescription>All recorded payments and settlements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {settlements.map((settlement) => (
                        <div key={settlement.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder.svg" />
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(settlement.from_user_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{settlement.from_user_name}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder.svg" />
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(settlement.to_user_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{settlement.to_user_name}</span>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(settlement.settlement_date), { addSuffix: true })}
                              </div>
                              {settlement.expense_title && (
                                <div className="text-xs">For: {settlement.expense_title}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge variant="outline" className="text-lg font-semibold">
                              {formatCurrency(settlement.amount)}
                            </Badge>
                            {settlement.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{settlement.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {showRecordDialog && (
            <RecordSettlementDialog
              balances={balances}
              onSettlementRecorded={() => {
                setShowRecordDialog(false)
                fetchData()
              }}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

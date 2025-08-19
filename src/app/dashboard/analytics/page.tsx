"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SpendingChart } from "@/components/analytics/spending-chart"
import { AnalyticsFilters } from "@/components/analytics/analytics-filters"
import { ExpenseSummary } from "@/components/analytics/expense-summary"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3 } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [filters, setFilters] = useState({
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    period: "30",
    groupId: undefined as string | undefined,
  })

  // Analytics data
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [trendsData, setTrendsData] = useState([])
  const [summary, setSummary] = useState({
    expenses_paid: 0,
    expenses_involved: 0,
    total_paid: 0,
    total_owed: 0,
    recent_expenses: 0,
  })
  const [settlementStats, setSettlementStats] = useState({
    payments_made: 0,
    payments_received: 0,
    total_paid: 0,
    total_received: 0,
  })

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const baseParams = new URLSearchParams()

      if (filters.startDate) baseParams.append("start_date", filters.startDate)
      if (filters.endDate) baseParams.append("end_date", filters.endDate)
      if (filters.groupId) baseParams.append("group_id", filters.groupId)

      // Fetch all analytics data
      const [categoryRes, monthlyRes, trendsRes, summaryRes, settlementsRes] = await Promise.all([
        fetch(`/api/analytics?type=category&${baseParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/analytics?type=monthly&${baseParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/analytics?type=trends&days=${filters.period}&${baseParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/analytics?type=summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/analytics?type=settlements`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [categoryData, monthlyData, trendsData, summaryData, settlementsData] = await Promise.all([
        categoryRes.json(),
        monthlyRes.json(),
        trendsRes.json(),
        summaryRes.json(),
        settlementsRes.json(),
      ])

      if (categoryData.success) setCategoryData(categoryData.data)
      if (monthlyData.success) {
        const formattedMonthly = monthlyData.data.map((item: any) => ({
          ...item,
          month_name: new Date(item.year, item.month - 1).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
        }))
        setMonthlyData(formattedMonthly)
      }
      if (trendsData.success) setTrendsData(trendsData.data)
      if (summaryData.success) setSummary(summaryData.data[0] || summary)
      if (settlementsData.success) setSettlementStats(settlementsData.data[0] || settlementStats)
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [filters])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <BarChart3 className="h-8 w-8 mr-3" />
              {t('analytics.pageTitle')}
            </h1>
            <p className="text-muted-foreground">{t('analytics.pageSubtitle')}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <AnalyticsFilters 
                onFiltersChange={(newFilters) => {
                  setFilters(prev => ({
                    ...prev,
                    ...newFilters,
                    startDate: newFilters.startDate,
                    endDate: newFilters.endDate,
                    period: newFilters.period,
                    groupId: newFilters.groupId
                  }));
                }} 
                groups={groups} 
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
                  <TabsTrigger value="categories">{t('analytics.categories')}</TabsTrigger>
                  <TabsTrigger value="trends">{t('analytics.trends')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-32" />
                        ))}
                      </div>
                      <div className="grid gap-6 lg:grid-cols-2">
                        {[...Array(2)].map((_, i) => (
                          <Skeleton key={i} className="h-64" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ExpenseSummary summary={summary} categoryData={categoryData} settlementStats={settlementStats} />
                  )}
                </TabsContent>

                <TabsContent value="categories">
                  {loading ? (
                    <Skeleton className="h-96" />
                  ) : (
                    <SpendingChart
                      data={categoryData.map((item: any) => ({
                        ...item,
                        category: item.category.replace(/_/g, " ").replace(/&/g, "&"),
                      }))}
                      type="pie"
                      title={t('analytics.spendingByCategory')}
                      description={t('analytics.spendingByCategorySubtitle')}
                      dataKey="total_amount"
                      nameKey="category"
                    />
                  )}
                </TabsContent>

                <TabsContent value="trends">
                  <div className="space-y-6">
                    {loading ? (
                      <>
                        <Skeleton className="h-96" />
                        <Skeleton className="h-96" />
                      </>
                    ) : (
                      <>
                        <SpendingChart
                          data={monthlyData}
                          type="bar"
                          title={t('analytics.monthlySpending')}
                          description={t('analytics.monthlySpendingSubtitle')}
                          dataKey="paid_amount"
                          nameKey="month_name"
                        />
                        <SpendingChart
                          data={trendsData}
                          type="line"
                          title={t('analytics.dailySpendingTrends')}
                          description={t('analytics.dailySpendingTrendsSubtitle')}
                          dataKey="total_amount"
                          nameKey="date"
                        />
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Filter } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"

interface AnalyticsFiltersProps {
  onFiltersChange: (filters: {
    startDate?: string
    endDate?: string
    period: string
    groupId?: string
  }) => void
  groups: Array<{ id: number; name: string }>
}

export function AnalyticsFilters({ onFiltersChange, groups }: AnalyticsFiltersProps) {
  const { t } = useI18n()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [period, setPeriod] = useState("30")
  const [groupId, setGroupId] = useState("")

  const handleApplyFilters = () => {
    onFiltersChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      period,
      groupId: groupId || undefined,
    })
  }

  const handleQuickPeriod = (days: string) => {
    setPeriod(days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - Number.parseInt(days))

    setEndDate(end.toISOString().split("T")[0])
    setStartDate(start.toISOString().split("T")[0])

    onFiltersChange({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      period: days,
      groupId: groupId || undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          {t('analytics.filters')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Period Buttons */}
        <div>
          <Label className="text-sm font-medium">{t('analytics.quickPeriods')}</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: t('analytics.last7Days'), value: "7" },
              { label: t('analytics.last30Days'), value: "30" },
              { label: t('analytics.last90Days'), value: "90" },
              { label: t('analytics.lastYear'), value: "365" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="start-date">{t('analytics.startDate')}</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end-date">{t('analytics.endDate')}</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Group Filter */}
        <div>
          <Label htmlFor="group">{t('analytics.group')}</Label>
          <Select 
            value={groupId || "all"} 
            onValueChange={(value) => setGroupId(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('analytics.allGroups')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('analytics.allGroups')}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleApplyFilters} className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          {t('analytics.applyFilters')}
        </Button>
      </CardContent>
    </Card>
  )
}

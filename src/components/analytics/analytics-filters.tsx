"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Filter } from "lucide-react"

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
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Period Buttons */}
        <div>
          <Label className="text-sm font-medium">Quick Periods</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: "Last 7 days", value: "7" },
              { label: "Last 30 days", value: "30" },
              { label: "Last 90 days", value: "90" },
              { label: "Last year", value: "365" },
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
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Group Filter */}
        <div>
          <Label htmlFor="group">Group</Label>
          <Select 
            value={groupId || "all"} 
            onValueChange={(value) => setGroupId(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
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
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}

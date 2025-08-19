"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, X, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"

interface ExpenseFiltersProps {
  onFiltersChange: (filters: {
    search?: string
    category?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    groupId?: string
    status?: string
  }) => void
  groups: Array<{ id: string; name: string }>
  categories: Array<{ id: number; name: string; icon?: string }>
}

export function ExpenseFilters({ onFiltersChange, groups, categories }: ExpenseFiltersProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState("expense_date")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc")
  const [groupId, setGroupId] = useState("all")
  const [status, setStatus] = useState("all")

  const activeFiltersCount = [
    search,
    category && category !== 'all',
    startDate,
    endDate,
    groupId && groupId !== 'all',
    status && status !== 'all'
  ].filter(Boolean).length

  const handleApplyFilters = () => {
    onFiltersChange({
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      groupId: groupId === 'all' ? undefined : groupId,
      status: status === 'all' ? undefined : status,
    })
  }

  const handleClearFilters = () => {
    setSearch("")
    setCategory("all")
    setStartDate("")
    setEndDate("")
    setGroupId("all")
    setStatus("all")
    setSortBy("expense_date")
    setSortOrder("desc")
    
    onFiltersChange({
      sortBy: "expense_date",
      sortOrder: "desc",
    })
  }

  const handleQuickFilter = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setEndDate(end.toISOString().split("T")[0])
    setStartDate(start.toISOString().split("T")[0])
    
    onFiltersChange({
      search: search || undefined,
      category: category || undefined,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      groupId: groupId || undefined,
      status: status || undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t('expenses.expenseFilters.title')}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">{t('expenses.expenseFilters.search')}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder={t('expenses.expenseFilters.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Date Filters */}
        <div>
          <Label className="text-sm font-medium">{t('expenses.expenseFilters.quickPeriods')}</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: t('expenses.expenseFilters.last7Days'), value: 7 },
              { label: t('expenses.expenseFilters.last30Days'), value: 30 },
              { label: t('expenses.expenseFilters.last90Days'), value: 90 },
              { label: t('expenses.expenseFilters.thisYear'), value: 365 },
            ].map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="start-date">{t('expenses.expenseFilters.startDate')}</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">{t('expenses.expenseFilters.endDate')}</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <Label htmlFor="category">{t('expenses.expenseFilters.category')}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t('expenses.expenseFilters.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('expenses.expenseFilters.allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name.toLowerCase().replace(/\s+/g, "_")}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Group Filter */}
        <div>
          <Label htmlFor="group">{t('expenses.expenseFilters.group')}</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger>
              <SelectValue placeholder={t('expenses.expenseFilters.allGroups')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('expenses.expenseFilters.allGroups')}</SelectItem>
              <SelectItem value="no-group">{t('settlements.noGroup')}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status">{t('expenses.expenseFilters.settlementStatus')}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t('expenses.expenseFilters.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('expenses.expenseFilters.allStatuses')}</SelectItem>
              <SelectItem value="settled">Fully Settled</SelectItem>
              <SelectItem value="partial">Partially Settled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="sort-by">{t('expenses.expenseFilters.sortBy')}</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense_date">Date</SelectItem>
                <SelectItem value="total_amount">Amount</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sort-order">{t('expenses.expenseFilters.order')}</Label>
            <Select 
              value={sortOrder} 
              onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t('expenses.expenseFilters.newestFirst')}</SelectItem>
                <SelectItem value="asc">{t('expenses.expenseFilters.oldestFirst')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleApplyFilters} className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          {t('expenses.expenseFilters.applyFilters')}
        </Button>
      </CardContent>
    </Card>
  )
}
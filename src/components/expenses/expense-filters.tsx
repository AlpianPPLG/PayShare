"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, X, Search } from "lucide-react"

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
            Filters
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
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Date Filters */}
        <div>
          <Label className="text-sm font-medium">Quick Periods</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: "Last 7 days", value: 7 },
              { label: "Last 30 days", value: 30 },
              { label: "Last 90 days", value: 90 },
              { label: "This year", value: 365 },
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
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
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
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
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
          <Label htmlFor="group">Group</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              <SelectItem value="no-group">No Group</SelectItem>
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
          <Label htmlFor="status">Settlement Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="settled">Fully Settled</SelectItem>
              <SelectItem value="partial">Partially Settled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="sort-by">Sort By</Label>
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
            <Label htmlFor="sort-order">Order</Label>
            <Select 
              value={sortOrder} 
              onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleApplyFilters} className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}
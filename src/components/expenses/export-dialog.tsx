"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, FileText, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import type { ExpenseWithDetails } from "@/lib/types"

interface ExportDialogProps {
  expenses: ExpenseWithDetails[]
  trigger?: React.ReactNode
}

export function ExportDialog({ expenses, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<"pdf" | "excel">("excel")
  const [dateRange, setDateRange] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [includeParticipants, setIncludeParticipants] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getFilteredExpenses = () => {
    let filtered = [...expenses]

    if (dateRange !== "all") {
      const now = new Date()
      let startFilter: Date

      switch (dateRange) {
        case "7days":
          startFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30days":
          startFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "90days":
          startFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "custom":
          if (startDate) startFilter = new Date(startDate)
          if (endDate) {
            const endFilter = new Date(endDate)
            filtered = filtered.filter(e => new Date(e.expense_date) <= endFilter)
          }
          break
        default:
          return filtered
      }

      if (startFilter!) {
        filtered = filtered.filter(e => new Date(e.expense_date) >= startFilter)
      }
    }

    return filtered
  }

  const exportToExcel = () => {
    const filteredExpenses = getFilteredExpenses()
    
    // Main expenses sheet
    const expensesData = filteredExpenses.map(expense => ({
      ID: expense.id,
      Title: expense.title,
      Description: expense.description || "",
      Amount: expense.total_amount,
      Currency: expense.currency,
      Category: expense.category.replace(/_/g, " "),
      "Paid By": expense.paid_by_name,
      "Split Method": expense.split_method,
      "Expense Date": new Date(expense.expense_date).toLocaleDateString(),
      Group: expense.group_name || "No Group",
      "Participants Count": expense.participants.length,
      "Created Date": new Date(expense.created_at).toLocaleDateString(),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(expensesData)
    XLSX.utils.book_append_sheet(wb, ws, "Expenses")

    // Participants sheet if requested
    if (includeParticipants) {
      const participantsData: any[] = []
      filteredExpenses.forEach(expense => {
        expense.participants.forEach(participant => {
          participantsData.push({
            "Expense ID": expense.id,
            "Expense Title": expense.title,
            "Participant Name": participant.user_name,
            "Participant Email": participant.user_email,
            "Amount Owed": participant.amount_owed,
            Percentage: participant.percentage || "",
            "Is Settled": participant.is_settled ? "Yes" : "No",
            "Settled Date": participant.settled_at ? new Date(participant.settled_at).toLocaleDateString() : "",
          })
        })
      })
      const participantsWs = XLSX.utils.json_to_sheet(participantsData)
      XLSX.utils.book_append_sheet(wb, participantsWs, "Participants")
    }

    // Summary sheet
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.total_amount, 0)
    const totalParticipants = filteredExpenses.reduce((sum, e) => sum + e.participants.length, 0)
    const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category.replace(/_/g, " ")
      acc[category] = (acc[category] || 0) + expense.total_amount
      return acc
    }, {} as Record<string, number>)

    const summaryData = [
      { Metric: "Total Expenses", Value: filteredExpenses.length },
      { Metric: "Total Amount", Value: formatCurrency(totalAmount) },
      { Metric: "Total Participants", Value: totalParticipants },
      { Metric: "Average Amount", Value: formatCurrency(totalAmount / filteredExpenses.length || 0) },
      { Metric: "", Value: "" },
      { Metric: "Category Breakdown", Value: "" },
      ...Object.entries(categoryBreakdown).map(([category, amount]) => ({
        Metric: category,
        Value: formatCurrency(amount),
      })),
    ]

    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

    const fileName = `expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const exportToPDF = () => {
    const filteredExpenses = getFilteredExpenses()
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text("Expense Report", 20, 20)
    
    // Summary
    doc.setFontSize(12)
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.total_amount, 0)
    doc.text(`Total Expenses: ${filteredExpenses.length}`, 20, 40)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 50)
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 60)
    
    let yPosition = 80
    
    // Expenses list
    doc.setFontSize(14)
    doc.text("Expenses", 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    filteredExpenses.forEach((expense, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.text(`${index + 1}. ${expense.title}`, 20, yPosition)
      doc.text(`${formatCurrency(expense.total_amount)}`, 150, yPosition)
      yPosition += 5
      
      if (includeDetails) {
        doc.text(`   Date: ${new Date(expense.expense_date).toLocaleDateString()}`, 25, yPosition)
        doc.text(`   Paid by: ${expense.paid_by_name}`, 25, yPosition + 5)
        doc.text(`   Category: ${expense.category.replace(/_/g, " ")}`, 25, yPosition + 10)
        yPosition += 15
        
        if (includeParticipants && expense.participants.length > 0) {
          doc.text(`   Participants:`, 25, yPosition)
          yPosition += 5
          expense.participants.forEach(participant => {
            doc.text(`     - ${participant.user_name}: ${formatCurrency(participant.amount_owed)}`, 30, yPosition)
            yPosition += 4
          })
          yPosition += 5
        }
      }
      
      yPosition += 5
    })
    
    const fileName = `expenses_report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const handleExport = async () => {
    setLoading(true)
    setError("")

    try {
      if (format === "excel") {
        exportToExcel()
      } else {
        exportToPDF()
      }
      setOpen(false)
    } catch (error) {
      setError("Failed to export data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Expenses</DialogTitle>
          <DialogDescription>
            Export your expense data to Excel or PDF format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Format Selection */}
          <div>
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(value: "pdf" | "excel") => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF (.pdf)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <Label htmlFor="date-range">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
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
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Export Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-details"
                checked={includeDetails}
                onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
              />
              <Label htmlFor="include-details" className="text-sm">
                Include detailed information
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-participants"
                checked={includeParticipants}
                onCheckedChange={(checked) => setIncludeParticipants(checked as boolean)}
              />
              <Label htmlFor="include-participants" className="text-sm">
                Include participant details
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Export Preview</p>
            <p className="text-sm text-muted-foreground">
              {getFilteredExpenses().length} expenses will be exported
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
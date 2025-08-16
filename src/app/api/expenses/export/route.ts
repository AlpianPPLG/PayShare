import { NextRequest, NextResponse } from "next/server"
import * as XLSX from 'xlsx'

import { authenticateRequest } from "@/lib/auth"
import { ExpenseModel } from "@/lib/models/expense"

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'xlsx' // Default to xlsx
  try {
    const user = authenticateRequest(request.headers.get("authorization"))
    if (!user) {
      return new NextResponse(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    const body = await request.json()
    const { expenseIds } = body

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "No expense IDs provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const expensesPromises = expenseIds.map(id => ExpenseModel.findById(parseInt(id, 10)))
    const fetchedExpenses = await Promise.all(expensesPromises)

    // Filter out nulls (not found) and check ownership
    const expenses = fetchedExpenses.filter(expense => 
      expense && (expense.created_by === user.userId || expense.participants.some(p => p.user_id === user.userId))
    );
    
    console.log(`Fetched ${expenses.length} expenses for export`)

    if (expenses.length === 0) {
      return new NextResponse(
        'No expenses found to export',
        { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        }
      )
    }

    // Format data for export
    const headers = [
      'ID', 'Title', 'Description', 'Amount', 'Currency', 
      'Category', 'Paid By', 'Date', 'Created At', 'Updated At'
    ]

    // Prepare data for export
    const exportData = expenses.map((expense: any) => ({
      'ID': expense.id,
      'Title': expense.title || '',
      'Description': expense.description || '',
      'Amount': expense.total_amount || 0,
      'Currency': expense.currency || 'IDR',
      'Category': expense.category || 'general',
      'Paid By': expense.paid_by_name || 'Unknown',
      'Date': expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : '',
      'Created At': expense.created_at ? new Date(expense.created_at).toISOString() : '',
      'Updated At': expense.updated_at ? new Date(expense.updated_at).toISOString() : ''
    }))

    if (format.toLowerCase() === 'csv') {
      // Generate CSV content
      const csvRows = [
        headers.join(','),
        ...exportData.map((row: any) => 
          headers.map(field => {
            const value = row[field]?.toString() || ''
            return `"${value.replace(/"/g, '""')}"`
          }).join(',')
        )
      ]

      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="expenses_export_${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      })
    } else {
      // Generate XLSX
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="expenses_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      })
    }
  } catch (error) {
    console.error("Export error:", error)
    return new NextResponse(
      JSON.stringify({ success: false, error: "Failed to export expenses" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

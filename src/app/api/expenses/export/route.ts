import { NextRequest, NextResponse } from "next/server"
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'xlsx' // Default to xlsx
  try {
    console.log("Export endpoint hit")
    
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!authHeader) {
      console.error("No authorization header")
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized - No token provided" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader
    
    if (!token) {
      console.error("No token found in authorization header")
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized - Invalid token format" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    console.log("Fetching expenses from:", `${baseUrl}/api/expenses`)
    
    // Fetch expenses data
    const expensesResponse = await fetch(`${baseUrl}/api/expenses`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!expensesResponse.ok) {
      const errorText = await expensesResponse.text()
      console.error("Failed to fetch expenses:", expensesResponse.status, errorText)
      throw new Error(`Failed to fetch expenses: ${expensesResponse.status} ${expensesResponse.statusText}`)
    }

    const data = await expensesResponse.json()
    const expenses = data?.data?.expenses || []
    
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
      'Paid By': expense.paid_by_user?.name || 'Unknown',
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

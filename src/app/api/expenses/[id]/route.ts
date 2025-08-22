/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import { ExpenseModel } from "@/lib/models/expense"
import { authenticateRequest } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  try {
    const authHeader = request.headers.get("authorization")
    const payload = authenticateRequest(authHeader)

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const expenseId = Number.parseInt(id, 10)
    if (isNaN(expenseId) || !Number.isInteger(expenseId) || expenseId <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid expense ID",
        },
        { status: 400 },
      )
    }

    const expense = await ExpenseModel.findById(expenseId)
    if (!expense) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Expense not found",
        },
        { status: 404 },
      )
    }

    // Check if user has access to this expense
    const hasAccess =
      expense.paid_by === payload.userId ||
      expense.created_by === payload.userId ||
      expense.participants.some((p) => p.user_id === payload.userId)

    if (!hasAccess) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { expense },
    })
  } catch (error) {
    console.error("Get expense error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  try {
    const authHeader = request.headers.get("authorization")
    const payload = authenticateRequest(authHeader)

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const expenseId = Number.parseInt(id, 10)
    if (isNaN(expenseId) || !Number.isInteger(expenseId) || expenseId <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid expense ID",
        },
        { status: 400 },
      )
    }

    // Check if expense exists and user has access
    const existingExpense = await ExpenseModel.findById(expenseId)
    if (!existingExpense) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Expense not found",
        },
        { status: 404 },
      )
    }

    // Only creator can update expense
    if (existingExpense.created_by !== payload.userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Only the creator can update this expense",
        },
        { status: 403 },
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      total_amount,
      currency,
      category,
      group_id,
      paid_by,
      split_method,
      expense_date,
      participants,
    } = body

    // Validate required fields
    if (!title || !total_amount || !paid_by || !split_method || !expense_date || !participants?.length) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Validate participants
    const participantIds = participants.map((p: any) => p.user_id)
    if (!participantIds.includes(Number(paid_by))) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Payer must be one of the participants",
        },
        { status: 400 },
      )
    }

    // Prepare update data
    const updateData = {
      title,
      description,
      total_amount: Number(total_amount),
      currency: currency || "IDR",
      category: category || "general",
      group_id: group_id ? Number(group_id) : undefined,
      paid_by: Number(paid_by),
      split_method,
      expense_date: new Date(expense_date),
      participants: participants.map((p: any) => ({
        user_id: Number(p.user_id),
        amount: p.amount ? Number(p.amount) : null,
        percentage: p.percentage ? Number(p.percentage) : null,
      })),
    }

    // Update expense
    const updatedExpense = await ExpenseModel.update(expenseId, updateData)
    if (!updatedExpense) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to update expense",
        },
        { status: 500 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { expense: updatedExpense },
      message: "Expense updated successfully",
    })
  } catch (error) {
    console.error("Update expense error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  try {
    const authHeader = request.headers.get("authorization")
    const payload = authenticateRequest(authHeader)

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const expenseId = Number.parseInt(id, 10)
    if (isNaN(expenseId) || !Number.isInteger(expenseId) || expenseId <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid expense ID",
        },
        { status: 400 },
      )
    }

    const expense = await ExpenseModel.findById(expenseId)
    if (!expense) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Expense not found",
        },
        { status: 404 },
      )
    }

    // Only creator can delete expense
    if (expense.created_by !== payload.userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Only the creator can delete this expense",
        },
        { status: 403 },
      )
    }

    const deleted = await ExpenseModel.delete(expenseId)
    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to delete expense",
        },
        { status: 500 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Expense deleted successfully",
    })
  } catch (error) {
    console.error("Delete expense error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

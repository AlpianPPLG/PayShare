import { type NextRequest, NextResponse } from "next/server"
import { ExpenseModel } from "@/lib/models/expense"
import { authenticateRequest } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const expenseId = Number.parseInt(params.id)
    if (isNaN(expenseId)) {
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const expenseId = Number.parseInt(params.id)
    if (isNaN(expenseId)) {
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

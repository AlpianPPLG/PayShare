import { type NextRequest, NextResponse } from "next/server"
import { ExpenseModel } from "@/lib/models/expense"
import { authenticateRequest } from "@/lib/auth"
import type { CreateExpenseData, ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const groupId = searchParams.get("group_id")

    let expenses
    if (groupId) {
      expenses = await ExpenseModel.getGroupExpenses(Number.parseInt(groupId), limit, offset)
    } else {
      expenses = await ExpenseModel.getUserExpenses(payload.userId, limit, offset)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { expenses },
    })
  } catch (error) {
    console.error("Get expenses error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!title || !total_amount || !paid_by || !expense_date || !participants || participants.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Create expense
    const expenseData: CreateExpenseData = {
      title,
      description,
      total_amount: Number.parseFloat(total_amount),
      currency,
      category,
      group_id: group_id ? Number.parseInt(group_id) : undefined,
      paid_by: Number.parseInt(paid_by),
      split_method,
      expense_date: new Date(expense_date),
      created_by: payload.userId,
    }

    const expenseId = await ExpenseModel.create(expenseData)

    // Calculate split amounts
    const splitAmounts = ExpenseModel.calculateSplitAmounts(expenseData.total_amount, participants, split_method)

    // Add participants
    const participantData = splitAmounts.map((split) => ({
      expense_id: expenseId,
      user_id: split.user_id,
      amount_owed: split.amount_owed,
      percentage: split.percentage,
    }))

    const participantsAdded = await ExpenseModel.addParticipants(participantData)
    if (!participantsAdded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to add participants",
        },
        { status: 500 },
      )
    }

    const expense = await ExpenseModel.findById(expenseId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { expense },
      message: "Expense created successfully",
    })
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

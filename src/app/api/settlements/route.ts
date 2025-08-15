import { type NextRequest, NextResponse } from "next/server"
import { SettlementModel } from "@/lib/models/settlement"
import { authenticateRequest } from "@/lib/auth"
import type { CreateSettlementData, ApiResponse } from "@/lib/types"

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

    let settlements
    if (groupId) {
      settlements = await SettlementModel.getGroupSettlements(Number.parseInt(groupId), limit, offset)
    } else {
      settlements = await SettlementModel.getUserSettlements(payload.userId, limit, offset)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settlements },
    })
  } catch (error) {
    console.error("Get settlements error:", error)
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
    const { from_user_id, to_user_id, amount, currency, expense_id, notes, settlement_date } = body

    if (!from_user_id || !to_user_id || !amount || !settlement_date) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    if (from_user_id === to_user_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Cannot create settlement between same user",
        },
        { status: 400 },
      )
    }

    const settlementData: CreateSettlementData = {
      from_user_id: Number.parseInt(from_user_id),
      to_user_id: Number.parseInt(to_user_id),
      amount: Number.parseFloat(amount),
      currency,
      expense_id: expense_id ? Number.parseInt(expense_id) : undefined,
      notes,
      settlement_date: new Date(settlement_date),
      created_by: payload.userId,
    }

    const settlementId = await SettlementModel.create(settlementData)

    // If this settlement is for a specific expense, mark participants as settled
    if (expense_id) {
      await SettlementModel.markExpenseSettled(Number.parseInt(expense_id), [settlementData.from_user_id])
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settlementId },
      message: "Settlement recorded successfully",
    })
  } catch (error) {
    console.error("Create settlement error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { SettlementModel } from "@/lib/models/settlement"
import { authenticateRequest } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

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
    const action = searchParams.get("action")

    if (action === "recalculate") {
      await SettlementModel.recalculateUserBalances(payload.userId)
    }

    const balances = await SettlementModel.getUserBalances(payload.userId)
    const debts = await SettlementModel.getSimplifiedDebts(payload.userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { balances, debts },
    })
  } catch (error) {
    console.error("Get balances error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

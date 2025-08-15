import { type NextRequest, NextResponse } from "next/server"
import { AnalyticsModel } from "@/lib/models/analytics"
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
    const type = searchParams.get("type")
    const startDate = searchParams.get("start_date") ? new Date(searchParams.get("start_date")!) : undefined
    const endDate = searchParams.get("end_date") ? new Date(searchParams.get("end_date")!) : undefined
    const year = searchParams.get("year") ? Number.parseInt(searchParams.get("year")!) : undefined
    const groupId = searchParams.get("group_id") ? Number.parseInt(searchParams.get("group_id")!) : undefined
    const days = searchParams.get("days") ? Number.parseInt(searchParams.get("days")!) : 30

    let data

    switch (type) {
      case "category":
        data = await AnalyticsModel.getSpendingByCategory(payload.userId, startDate, endDate)
        break

      case "monthly":
        data = await AnalyticsModel.getMonthlySpending(payload.userId, year)
        break

      case "group":
        if (!groupId) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: "Group ID is required for group analytics",
            },
            { status: 400 },
          )
        }
        data = await AnalyticsModel.getGroupSpending(groupId, startDate, endDate)
        break

      case "trends":
        data = await AnalyticsModel.getExpenseTrends(payload.userId, days)
        break

      case "top-categories":
        data = await AnalyticsModel.getTopCategories(payload.userId)
        break

      case "settlements":
        data = await AnalyticsModel.getSettlementStats(payload.userId)
        break

      case "summary":
        data = await AnalyticsModel.getExpenseSummary(payload.userId)
        break

      default:
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Invalid analytics type",
          },
          { status: 400 },
        )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

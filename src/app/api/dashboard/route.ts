import { type NextRequest, NextResponse } from "next/server"
import { AnalyticsModel } from "@/lib/models/analytics"
import { SettlementModel } from "@/lib/models/settlement"
import { ExpenseModel } from "@/lib/models/expense"
import { GroupModel } from "@/lib/models/group"
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

    // Fetch dashboard data in parallel
    const [
      expenseSummary,
      userGroups,
      recentExpenses,
      userBalances,
      recentSettlements,
    ] = await Promise.all([
      AnalyticsModel.getExpenseSummary(payload.userId),
      GroupModel.getUserGroups(payload.userId),
      ExpenseModel.getUserExpenses(payload.userId, 5, 0), // Last 5 expenses
      SettlementModel.getUserBalances(payload.userId),
      SettlementModel.getUserSettlements(payload.userId, 5, 0), // Last 5 settlements
    ])

    // Calculate stats
    const summary = expenseSummary[0] || {
      expenses_paid: 0,
      expenses_involved: 0,
      total_paid: 0,
      total_owed: 0,
      recent_expenses: 0,
    }

    const totalOwed = userBalances.reduce((sum, b) => sum + (b.net_balance < 0 ? Math.abs(b.net_balance) : 0), 0)
    const totalOwes = userBalances.reduce((sum, b) => sum + (b.net_balance > 0 ? b.net_balance : 0), 0)

    const stats = {
      totalOwed,
      totalOwes,
      activeGroups: userGroups.length,
      recentExpenses: summary.recent_expenses,
    }

    // Format recent activities
    const activities = []

    // Add recent expenses as activities
    for (const expense of recentExpenses.slice(0, 3)) {
      activities.push({
        id: expense.id,
        type: "expense",
        title: expense.title,
        description: `Split with ${expense.participants.length} participant${expense.participants.length !== 1 ? 's' : ''}`,
        amount: expense.total_amount,
        user: {
          name: expense.paid_by_name,
          avatar_url: null,
        },
        created_at: expense.created_at,
        status: expense.participants.every(p => p.is_settled) ? "completed" : "pending",
        expense_id: expense.id,
        expense_title: expense.title,
      })
    }

    // Add recent settlements as activities
    for (const settlement of recentSettlements.slice(0, 2)) {
      activities.push({
        id: settlement.id + 10000, // Offset to avoid ID conflicts
        type: "settlement",
        title: "Payment recorded",
        description: `${settlement.from_user_name} paid ${settlement.to_user_name}`,
        amount: settlement.amount,
        user: {
          name: settlement.from_user_name,
          avatar_url: null,
        },
        created_at: settlement.created_at,
        status: "completed",
      })
    }

    // Sort activities by date
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stats,
        activities: activities.slice(0, 5), // Limit to 5 most recent
        summary,
        balances: userBalances,
        groups: userGroups,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

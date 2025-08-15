import { type NextRequest, NextResponse } from "next/server"
import { ExpenseModel } from "@/lib/models/expense"
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

    const categories = await ExpenseModel.getCategories()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { categories },
    })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

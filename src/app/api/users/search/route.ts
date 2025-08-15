import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/user"
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
    const query = searchParams.get("q")
    const excludeIds = searchParams.get("exclude")?.split(",").map(Number) || []

    if (!query || query.length < 2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Search query must be at least 2 characters",
        },
        { status: 400 },
      )
    }

    // Exclude the current user from search results
    excludeIds.push(payload.userId)

    const users = await UserModel.search(query, excludeIds)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { users },
    })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

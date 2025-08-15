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

    const user = await UserModel.getProfile(payload.userId)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { name, phone } = body

    const updated = await UserModel.updateProfile(payload.userId, { name, phone })
    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to update profile",
        },
        { status: 500 },
      )
    }

    const user = await UserModel.getProfile(payload.userId)
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user },
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

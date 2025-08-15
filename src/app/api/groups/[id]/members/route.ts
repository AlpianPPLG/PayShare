import { type NextRequest, NextResponse } from "next/server"
import { GroupModel } from "@/lib/models/group"
import { UserModel } from "@/lib/models/user"
import { authenticateRequest } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const groupId = Number.parseInt(params.id)
    if (isNaN(groupId)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid group ID",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    // Check if requesting user is member of the group
    const isMember = await GroupModel.isMember(groupId, payload.userId)
    if (!isMember) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      )
    }

    // Check if user to be added exists
    const userExists = await UserModel.findById(userId)
    if (!userExists) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    const added = await GroupModel.addMember(groupId, userId)
    if (!added) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "User is already a member or failed to add",
        },
        { status: 400 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Member added successfully",
    })
  } catch (error) {
    console.error("Add member error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

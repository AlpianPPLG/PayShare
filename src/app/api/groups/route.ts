import { type NextRequest, NextResponse } from "next/server"
import { GroupModel } from "@/lib/models/group"
import { authenticateRequest } from "@/lib/auth"
import type { CreateGroupData, ApiResponse } from "@/lib/types"

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

    const groups = await GroupModel.getUserGroups(payload.userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { groups },
    })
  } catch (error) {
    console.error("Get groups error:", error)
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

    const body: CreateGroupData = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Group name is required",
        },
        { status: 400 },
      )
    }

    const groupId = await GroupModel.create({
      name,
      description,
      created_by: payload.userId,
    })

    const group = await GroupModel.findById(groupId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { group },
      message: "Group created successfully",
    })
  } catch (error) {
    console.error("Create group error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { GroupModel } from "@/lib/models/group"
import { authenticateRequest } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user is member of the group
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

    const group = await GroupModel.findById(groupId)
    if (!group) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Group not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { group },
    })
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { name, description } = body

    const updated = await GroupModel.update(groupId, { name, description })
    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to update group",
        },
        { status: 500 },
      )
    }

    const group = await GroupModel.findById(groupId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { group },
      message: "Group updated successfully",
    })
  } catch (error) {
    console.error("Update group error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const deleted = await GroupModel.delete(groupId)
    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to delete group",
        },
        { status: 500 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Group deleted successfully",
    })
  } catch (error) {
    console.error("Delete group error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

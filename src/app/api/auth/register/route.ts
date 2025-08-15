import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/user"
import { generateToken } from "@/lib/auth"
import type { RegisterData, ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json()
    const { name, email, password, phone } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Name, email, and password are required",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 },
      )
    }

    // Create new user
    const userId = await UserModel.create({ name, email, password, phone })
    const user = await UserModel.getProfile(userId)

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to create user",
        },
        { status: 500 },
      )
    }

    // Generate JWT token
    const token = generateToken(user)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user, token },
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

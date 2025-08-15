import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/user"
import { generateToken } from "@/lib/auth"
import type { LoginCredentials, ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const user = await UserModel.findByEmail(email)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Get user profile (without password)
    const userProfile = await UserModel.getProfile(user.id)
    if (!userProfile) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to get user profile",
        },
        { status: 500 },
      )
    }

    // Generate JWT token
    const token = generateToken(userProfile)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user: userProfile, token },
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

import { executeQuery, executeQuerySingle, executeInsert } from "../database"
import type { User, CreateUserData, AuthUser } from "../types"
import bcrypt from "bcryptjs"

export class UserModel {
  // Create new user
  static async create(userData: CreateUserData): Promise<number> {
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const query = `
      INSERT INTO users (name, email, password, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `

    return executeInsert(query, [
      userData.name,
      userData.email,
      hashedPassword,
      userData.phone || null,
      userData.avatar_url || null,
    ])
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = ? AND is_active = TRUE"
    return executeQuerySingle<User>(query, [email])
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = ? AND is_active = TRUE"
    return executeQuerySingle<User>(query, [id])
  }

  // Get user profile (without password)
  static async getProfile(id: number): Promise<AuthUser | null> {
    const query = `
      SELECT id, name, email, phone, avatar_url 
      FROM users 
      WHERE id = ? AND is_active = TRUE
    `
    return executeQuerySingle<AuthUser>(query, [id])
  }

  // Update user profile
  static async updateProfile(id: number, data: Partial<CreateUserData>): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.name) {
      fields.push("name = ?")
      values.push(data.name)
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?")
      values.push(data.phone)
    }
    if (data.avatar_url !== undefined) {
      fields.push("avatar_url = ?")
      values.push(data.avatar_url)
    }

    if (fields.length === 0) return false

    values.push(id)
    const query = `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(query, values)
    return (result as any).affectedRows > 0
  }

  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  // Search users by name or email
  static async search(query: string, excludeIds: number[] = []): Promise<AuthUser[]> {
    let sql = `
      SELECT id, name, email, phone, avatar_url 
      FROM users 
      WHERE (name LIKE ? OR email LIKE ?) AND is_active = TRUE
    `
    const params = [`%${query}%`, `%${query}%`]

    if (excludeIds.length > 0) {
      sql += ` AND id NOT IN (${excludeIds.map(() => "?").join(",")})`
      params.push(...excludeIds.map(id => id.toString()))
    }

    sql += " ORDER BY name LIMIT 20"
    return executeQuery<AuthUser>(sql, params)
  }

  // Get all users (for admin purposes)
  static async getAll(): Promise<AuthUser[]> {
    const query = `
      SELECT id, name, email, phone, avatar_url 
      FROM users 
      WHERE is_active = TRUE 
      ORDER BY name
    `
    return executeQuery<AuthUser>(query)
  }
}

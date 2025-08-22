/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from "mysql2/promise"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "expense_splitter_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig)

// Database connection utility
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error("Database operation failed")
  }
}

// Get single record
export async function executeQuerySingle<T = any>(query: string, params: any[] = []): Promise<T | null> {
  const results = await executeQuery<T>(query, params)
  return results.length > 0 ? results[0] : null
}

// Execute insert and return inserted ID
export async function executeInsert(query: string, params: any[] = []): Promise<number> {
  try {
    const [result] = await pool.execute(query, params)
    return (result as any).insertId
  } catch (error) {
    console.error("Database insert error:", error)
    throw new Error("Database insert failed")
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await pool.execute("SELECT 1")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

export default pool

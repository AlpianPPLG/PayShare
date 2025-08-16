import { executeQuery, executeQuerySingle, executeInsert } from "../database"
import type { ExpenseParticipant, CreateExpenseData, CreateExpenseParticipantData, ExpenseWithDetails } from "../types"

export class ExpenseModel {
  // Create new expense
  static async create(expenseData: CreateExpenseData): Promise<number> {
    const query = `
      INSERT INTO expenses (title, description, total_amount, currency, category, group_id, paid_by, split_method, expense_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    return executeInsert(query, [
      expenseData.title,
      expenseData.description || null,
      expenseData.total_amount,
      expenseData.currency || "IDR",
      expenseData.category || "general",
      expenseData.group_id || null,
      expenseData.paid_by,
      expenseData.split_method || "equal",
      expenseData.expense_date,
      expenseData.created_by,
    ])
  }

  // Add participants to expense
  static async addParticipants(participants: CreateExpenseParticipantData[]): Promise<boolean> {
    if (participants.length === 0) return true

    const values = participants
      .map((p) => `(${p.expense_id}, ${p.user_id}, ${p.amount_owed}, ${p.percentage || "NULL"})`)
      .join(", ")
    const query = `
      INSERT INTO expense_participants (expense_id, user_id, amount_owed, percentage)
      VALUES ${values}
    `

    try {
      await executeQuery(query)
      return true
    } catch (error) {
      console.error("Add participants error:", error)
      return false
    }
  }

  // Get expense by ID with details
  static async findById(id: number): Promise<ExpenseWithDetails | null> {
    const expenseQuery = `
      SELECT e.*, 
             u.name as paid_by_name, u.email as paid_by_email,
             g.name as group_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      LEFT JOIN groups g ON e.group_id = g.id
      WHERE e.id = ?
    `

    const expense = await executeQuerySingle<ExpenseWithDetails>(expenseQuery, [id])
    if (!expense) return null

    // Get participants
    const participantsQuery = `
      SELECT ep.*, u.name as user_name, u.email as user_email
      FROM expense_participants ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.expense_id = ?
      ORDER BY u.name
    `

    const participants = await executeQuery<ExpenseParticipant & { user_name: string; user_email: string }>(
      participantsQuery,
      [id],
    )

    return {
      ...expense,
      participants,
    }
  }

  // Get user's expenses
  static async getUserExpenses(
    userId: number, 
    limit = 50, 
    offset = 0,
    filters?: {
      search?: string
      category?: string
      startDate?: Date
      endDate?: Date
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  ): Promise<ExpenseWithDetails[]> {
    let query = `
      SELECT DISTINCT e.*, 
             u.name as paid_by_name, u.email as paid_by_email,
             g.name as group_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      LEFT JOIN groups g ON e.group_id = g.id
      LEFT JOIN expense_participants ep ON e.id = ep.expense_id
      WHERE e.paid_by = ? OR ep.user_id = ?
    `
    const params: any[] = [userId, userId]

    // Apply filters
    if (filters?.search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR u.name LIKE ?)`
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (filters?.category) {
      query += ` AND e.category = ?`
      params.push(filters.category)
    }

    if (filters?.startDate) {
      query += ` AND e.expense_date >= ?`
      params.push(filters.startDate.toISOString().split('T')[0])
    }

    if (filters?.endDate) {
      query += ` AND e.expense_date <= ?`
      params.push(filters.endDate.toISOString().split('T')[0])
    }

    // Apply sorting
    const validSortColumns = ['expense_date', 'total_amount', 'title', 'created_at']
    const sortBy = filters && filters.sortBy && validSortColumns.includes(filters.sortBy) 
      ? filters.sortBy 
      : 'expense_date'
    const sortOrder = filters && filters.sortOrder === 'asc' ? 'ASC' : 'DESC'
    
    query += ` ORDER BY e.${sortBy} ${sortOrder}, e.created_at DESC`
    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const expenses = await executeQuery<ExpenseWithDetails>(query, params)

    // Get participants for each expense
    for (const expense of expenses) {
      const participantsQuery = `
        SELECT ep.*, u.name as user_name, u.email as user_email
        FROM expense_participants ep
        JOIN users u ON ep.user_id = u.id
        WHERE ep.expense_id = ?
        ORDER BY u.name
      `

      expense.participants = await executeQuery<ExpenseParticipant & { user_name: string; user_email: string }>(
        participantsQuery,
        [expense.id],
      )
    }

    return expenses
  }

  // Get group expenses
  static async getGroupExpenses(groupId: number, limit = 50, offset = 0): Promise<ExpenseWithDetails[]> {
    const query = `
      SELECT e.*, 
             u.name as paid_by_name, u.email as paid_by_email,
             g.name as group_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      LEFT JOIN groups g ON e.group_id = g.id
      WHERE e.group_id = ?
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `

    const expenses = await executeQuery<ExpenseWithDetails>(query, [groupId, limit, offset])

    // Get participants for each expense
    for (const expense of expenses) {
      const participantsQuery = `
        SELECT ep.*, u.name as user_name, u.email as user_email
        FROM expense_participants ep
        JOIN users u ON ep.user_id = u.id
        WHERE ep.expense_id = ?
        ORDER BY u.name
      `

      expense.participants = await executeQuery<ExpenseParticipant & { user_name: string; user_email: string }>(
        participantsQuery,
        [expense.id],
      )
    }

    return expenses
  }

  // Update expense
  static async update(id: number, data: Partial<CreateExpenseData>): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.title) {
      fields.push("title = ?")
      values.push(data.title)
    }
    if (data.description !== undefined) {
      fields.push("description = ?")
      values.push(data.description)
    }
    if (data.total_amount) {
      fields.push("total_amount = ?")
      values.push(data.total_amount)
    }
    if (data.category) {
      fields.push("category = ?")
      values.push(data.category)
    }
    if (data.expense_date) {
      fields.push("expense_date = ?")
      values.push(data.expense_date)
    }

    if (fields.length === 0) return false

    values.push(id)
    const query = `UPDATE expenses SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(query, values)
    return (result as any).affectedRows > 0
  }

  // Delete expense
  static async delete(id: number): Promise<boolean> {
    // Delete participants first (cascade should handle this, but being explicit)
    await executeQuery("DELETE FROM expense_participants WHERE expense_id = ?", [id])

    const query = "DELETE FROM expenses WHERE id = ?"
    const result = await executeQuery(query, [id])
    return (result as any).affectedRows > 0
  }

  // Get categories
  static async getCategories() {
    const query = "SELECT * FROM categories ORDER BY name"
    return executeQuery(query)
  }

  // Calculate split amounts
  static calculateSplitAmounts(
    totalAmount: number,
    participants: { user_id: number; percentage?: number; amount?: number }[],
    splitMethod: "equal" | "exact" | "percentage",
  ): { user_id: number; amount_owed: number; percentage?: number }[] {
    switch (splitMethod) {
      case "equal":
        const equalAmount = Math.round((totalAmount / participants.length) * 100) / 100
        return participants.map((p) => ({
          user_id: p.user_id,
          amount_owed: equalAmount,
        }))

      case "exact":
        return participants.map((p) => ({
          user_id: p.user_id,
          amount_owed: p.amount || 0,
        }))

      case "percentage":
        return participants.map((p) => ({
          user_id: p.user_id,
          amount_owed: Math.round(((totalAmount * (p.percentage || 0)) / 100) * 100) / 100,
          percentage: p.percentage,
        }))

      default:
        throw new Error("Invalid split method")
    }
  }
}

/* eslint-disable prefer-const */
import { executeQuery } from "../database"

// Type for query parameters
type QueryParam = string | number | Date | null | undefined

export class AnalyticsModel {
  // Get spending by category for a user with detailed statistics
  static async getSpendingByCategory(userId: number, startDate?: Date, endDate?: Date) {
    let query = `
      WITH user_expenses AS (
        SELECT DISTINCT e.*
        FROM expenses e
        LEFT JOIN expense_participants ep ON e.id = ep.expense_id
        WHERE (e.paid_by = ? OR ep.user_id = ?)
        ${startDate ? ' AND e.expense_date >= ?' : ''}
        ${endDate ? ' AND e.expense_date <= ?' : ''}
      )
      SELECT 
        e.category,
        COUNT(*) as expense_count,
        SUM(e.total_amount) as total_amount,
        AVG(e.total_amount) as avg_amount,
        MIN(e.total_amount) as min_amount,
        MAX(e.total_amount) as max_amount,
        COUNT(DISTINCT e.paid_by) as unique_payers,
        (
          SELECT COUNT(*) 
          FROM user_expenses e2 
          WHERE e2.category = e.category
        ) as total_transactions,
        (
          SELECT e3.expense_date 
          FROM user_expenses e3 
          WHERE e3.category = e.category
          ORDER BY e3.expense_date DESC 
          LIMIT 1
        ) as last_transaction_date,
        (
          SELECT e4.description 
          FROM user_expenses e4 
          WHERE e4.category = e.category
          ORDER BY e4.total_amount DESC 
          LIMIT 1
        ) as largest_expense_desc,
        (
          SELECT e5.expense_date
          FROM user_expenses e5
          WHERE e5.category = e.category
          ORDER BY e5.expense_date ASC
          LIMIT 1
        ) as first_transaction_date,
        (
          SELECT GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ')
          FROM user_expenses e6
          JOIN users u ON e6.paid_by = u.id
          WHERE e6.category = e.category
          LIMIT 3
        ) as top_payers
      FROM user_expenses e
      GROUP BY e.category
      ORDER BY total_amount DESC
    `
    
    // Prepare parameters array
    let params: QueryParam[] = [userId, userId]
    
    // Add date parameters
    if (startDate) params.push(startDate.toISOString().split('T')[0])
    if (endDate) params.push(endDate.toISOString().split('T')[0])
    
    return executeQuery(query, params)
  }

  // Get monthly spending trends
  static async getMonthlySpending(userId: number, year?: number) {
    let query = `
      SELECT 
        YEAR(e.expense_date) as year,
        MONTH(e.expense_date) as month,
        COUNT(*) as expense_count,
        SUM(CASE WHEN e.paid_by = ? THEN e.total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN ep.user_id = ? THEN ep.amount_owed ELSE 0 END) as owed_amount
      FROM expenses e
      LEFT JOIN expense_participants ep ON e.id = ep.expense_id
      WHERE (e.paid_by = ? OR ep.user_id = ?)
    `
    const params: QueryParam[] = [userId, userId, userId, userId]

    if (year) {
      query += " AND YEAR(e.expense_date) = ?"
      params.push(year)
    }

    query += `
      GROUP BY YEAR(e.expense_date), MONTH(e.expense_date)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `

    return executeQuery(query, params)
  }

  // Get group spending analytics
  static async getGroupSpending(groupId: number, startDate?: Date, endDate?: Date) {
    let query = `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        COUNT(CASE WHEN e.paid_by = u.id THEN 1 END) as expenses_paid,
        SUM(CASE WHEN e.paid_by = u.id THEN e.total_amount ELSE 0 END) as total_paid,
        COUNT(CASE WHEN ep.user_id = u.id THEN 1 END) as expenses_involved,
        SUM(CASE WHEN ep.user_id = u.id THEN ep.amount_owed ELSE 0 END) as total_owed
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN expenses e ON (e.paid_by = u.id AND e.group_id = ?)
      LEFT JOIN expense_participants ep ON (ep.user_id = u.id AND ep.expense_id IN (
        SELECT id FROM expenses WHERE group_id = ?
      ))
      WHERE gm.group_id = ?
    `
    const params: QueryParam[] = [groupId, groupId, groupId]

    if (startDate) {
      query += " AND (e.expense_date >= ? OR e.expense_date IS NULL)"
      params.push(startDate.toISOString().split('T')[0]) // Format as YYYY-MM-DD
    }
    if (endDate) {
      query += " AND (e.expense_date <= ? OR e.expense_date IS NULL)"
      params.push(endDate.toISOString().split('T')[0]) // Format as YYYY-MM-DD
    }

    query += `
      GROUP BY u.id, u.name
      ORDER BY total_paid DESC
    `

    return executeQuery(query, params)
  }

  // Get expense trends over time
  static async getExpenseTrends(userId: number, days = 30) {
    const query = `
      SELECT 
        DATE(e.expense_date) as date,
        COUNT(*) as expense_count,
        SUM(e.total_amount) as total_amount
      FROM expenses e
      LEFT JOIN expense_participants ep ON e.id = ep.expense_id
      WHERE (e.paid_by = ? OR ep.user_id = ?)
        AND e.expense_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(e.expense_date)
      ORDER BY date ASC
    `

    return executeQuery(query, [userId, userId, days])
  }

  // Get top spending categories
  static async getTopCategories(userId: number, limit = 5) {
    const query = `
      SELECT 
        e.category,
        COUNT(*) as expense_count,
        SUM(CASE WHEN e.paid_by = ? THEN e.total_amount ELSE ep.amount_owed END) as total_spent
      FROM expenses e
      LEFT JOIN expense_participants ep ON e.id = ep.expense_id AND ep.user_id = ?
      WHERE (e.paid_by = ? OR ep.user_id = ?)
      GROUP BY e.category
      ORDER BY total_spent DESC
      LIMIT ?
    `

    return executeQuery(query, [userId, userId, userId, userId, limit])
  }

  // Get settlement statistics
  static async getSettlementStats(userId: number) {
    const query = `
      SELECT 
        COUNT(CASE WHEN from_user_id = ? THEN 1 END) as payments_made,
        COUNT(CASE WHEN to_user_id = ? THEN 1 END) as payments_received,
        SUM(CASE WHEN from_user_id = ? THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN to_user_id = ? THEN amount ELSE 0 END) as total_received
      FROM settlements
      WHERE from_user_id = ? OR to_user_id = ?
    `

    return executeQuery(query, [userId, userId, userId, userId, userId, userId])
  }

  // Get expense summary for dashboard
  static async getExpenseSummary(userId: number) {
    const query = `
      SELECT 
        COUNT(CASE WHEN e.paid_by = ? THEN 1 END) as expenses_paid,
        COUNT(CASE WHEN ep.user_id = ? THEN 1 END) as expenses_involved,
        SUM(CASE WHEN e.paid_by = ? THEN e.total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN ep.user_id = ? THEN ep.amount_owed ELSE 0 END) as total_owed,
        COUNT(CASE WHEN e.expense_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
              AND (e.paid_by = ? OR ep.user_id = ?) THEN 1 END) as recent_expenses
      FROM expenses e
      LEFT JOIN expense_participants ep ON e.id = ep.expense_id
      WHERE e.paid_by = ? OR ep.user_id = ?
    `

    return executeQuery(query, [userId, userId, userId, userId, userId, userId, userId, userId])
  }
}

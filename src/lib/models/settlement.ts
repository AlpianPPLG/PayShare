/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery, executeQuerySingle, executeInsert } from "../database"
import type { Settlement, CreateSettlementData, UserBalance } from "../types"

export class SettlementModel {
  // Create new settlement
  static async create(settlementData: CreateSettlementData): Promise<number> {
    const query = `
      INSERT INTO settlements (from_user_id, to_user_id, amount, currency, expense_id, notes, settlement_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    const settlementId = await executeInsert(query, [
      settlementData.from_user_id,
      settlementData.to_user_id,
      settlementData.amount,
      settlementData.currency || "IDR",
      settlementData.expense_id || null,
      settlementData.notes || null,
      settlementData.settlement_date,
      settlementData.created_by,
    ])

    // Update balances after settlement
    await this.updateBalances(settlementData.from_user_id, settlementData.to_user_id, settlementData.amount)

    return settlementId
  }

  // Get user's settlements
  static async getUserSettlements(userId: number, limit = 50, offset = 0): Promise<Settlement[]> {
    const query = `
      SELECT s.*, 
             u1.name as from_user_name, u1.email as from_user_email,
             u2.name as to_user_name, u2.email as to_user_email,
             e.title as expense_title
      FROM settlements s
      JOIN users u1 ON s.from_user_id = u1.id
      JOIN users u2 ON s.to_user_id = u2.id
      LEFT JOIN expenses e ON s.expense_id = e.id
      WHERE s.from_user_id = ? OR s.to_user_id = ?
      ORDER BY s.settlement_date DESC, s.created_at DESC
      LIMIT ? OFFSET ?
    `

    return executeQuery<Settlement>(query, [userId, userId, limit, offset])
  }

  // Get group settlements
  static async getGroupSettlements(groupId: number, limit = 50, offset = 0): Promise<Settlement[]> {
    const query = `
      SELECT DISTINCT s.*, 
             u1.name as from_user_name, u1.email as from_user_email,
             u2.name as to_user_name, u2.email as to_user_email,
             e.title as expense_title
      FROM settlements s
      JOIN users u1 ON s.from_user_id = u1.id
      JOIN users u2 ON s.to_user_id = u2.id
      LEFT JOIN expenses e ON s.expense_id = e.id
      LEFT JOIN group_members gm1 ON s.from_user_id = gm1.user_id
      LEFT JOIN group_members gm2 ON s.to_user_id = gm2.user_id
      WHERE (gm1.group_id = ? OR gm2.group_id = ?) OR e.group_id = ?
      ORDER BY s.settlement_date DESC, s.created_at DESC
      LIMIT ? OFFSET ?
    `

    return executeQuery<Settlement>(query, [groupId, groupId, groupId, limit, offset])
  }

  // Update balances between two users
  static async updateBalances(fromUserId: number, toUserId: number, amount: number): Promise<void> {
    // Update or create balance record
    const upsertQuery = `
      INSERT INTO balances (user_id, with_user_id, balance)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        balance = balance - ?,
        last_updated = CURRENT_TIMESTAMP
    `

    // Update balance: fromUser owes less to toUser
    await executeQuery(upsertQuery, [fromUserId, toUserId, -amount, amount])

    // Update reverse balance: toUser is owed less by fromUser
    await executeQuery(upsertQuery, [toUserId, fromUserId, amount, amount])
  }

  // Calculate and update all balances for a user (from expenses)
  static async recalculateUserBalances(userId: number): Promise<void> {
    // Clear existing balances for this user
    await executeQuery("DELETE FROM balances WHERE user_id = ? OR with_user_id = ?", [userId, userId])

    // Calculate balances from expenses
    const query = `
      SELECT 
        CASE 
          WHEN e.paid_by = ? THEN ep.user_id
          ELSE e.paid_by
        END as other_user_id,
        SUM(
          CASE 
            WHEN e.paid_by = ? THEN -ep.amount_owed  -- User paid, others owe them
            ELSE ep.amount_owed                      -- User owes to payer
          END
        ) as net_balance
      FROM expenses e
      JOIN expense_participants ep ON e.id = ep.expense_id
      WHERE (e.paid_by = ? OR ep.user_id = ?)
        AND (e.paid_by != ep.user_id)  -- Don't include self-payments
        AND ep.is_settled = FALSE
      GROUP BY other_user_id
      HAVING net_balance != 0
    `

    const balances = await executeQuery<{ other_user_id: number; net_balance: number }>(query, [
      userId,
      userId,
      userId,
      userId,
    ])

    // Insert calculated balances
    for (const balance of balances) {
      await executeQuery(
        `INSERT INTO balances (user_id, with_user_id, balance) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE balance = VALUES(balance), last_updated = CURRENT_TIMESTAMP`,
        [userId, balance.other_user_id, balance.net_balance],
      )
    }
  }

  // Get user's balance summary
  static async getUserBalances(userId: number): Promise<UserBalance[]> {
    const query = `
      SELECT 
        b.with_user_id as user_id,
        u.name as user_name,
        u.email as user_email,
        CASE WHEN b.balance > 0 THEN b.balance ELSE 0 END as total_owes,
        CASE WHEN b.balance < 0 THEN ABS(b.balance) ELSE 0 END as total_owed,
        b.balance as net_balance
      FROM balances b
      JOIN users u ON b.with_user_id = u.id
      WHERE b.user_id = ? AND b.balance != 0
      ORDER BY ABS(b.balance) DESC
    `

    return executeQuery<UserBalance>(query, [userId])
  }

  // Get simplified debts (who owes what to whom)
  static async getSimplifiedDebts(userId: number): Promise<
    Array<{
      from_user_id: number
      from_user_name: string
      to_user_id: number
      to_user_name: string
      amount: number
    }>
  > {
    const query = `
      SELECT 
        b.user_id as from_user_id,
        u1.name as from_user_name,
        b.with_user_id as to_user_id,
        u2.name as to_user_name,
        b.balance as amount
      FROM balances b
      JOIN users u1 ON b.user_id = u1.id
      JOIN users u2 ON b.with_user_id = u2.id
      WHERE (b.user_id = ? OR b.with_user_id = ?) 
        AND b.balance > 0
      ORDER BY b.balance DESC
    `

    return executeQuery(query, [userId, userId])
  }

  // Mark expense participants as settled
  static async markExpenseSettled(expenseId: number, participantIds: number[]): Promise<boolean> {
    if (participantIds.length === 0) return true

    const placeholders = participantIds.map(() => "?").join(",")
    const query = `
      UPDATE expense_participants 
      SET is_settled = TRUE, settled_at = CURRENT_TIMESTAMP
      WHERE expense_id = ? AND user_id IN (${placeholders})
    `

    const result = await executeQuery(query, [expenseId, ...participantIds])
    return (result as any).affectedRows > 0
  }

  // Delete settlement
  static async delete(id: number): Promise<boolean> {
    // Get settlement details first to reverse balance changes
    const settlement = await executeQuerySingle<Settlement>("SELECT * FROM settlements WHERE id = ?", [id])

    if (!settlement) return false

    // Reverse the balance changes
    await this.updateBalances(settlement.to_user_id, settlement.from_user_id, settlement.amount)

    // Delete the settlement
    const result = await executeQuery("DELETE FROM settlements WHERE id = ?", [id])
    return (result as any).affectedRows > 0
  }
}

import { executeQuery, executeQuerySingle, executeInsert } from "../database"
import type { Group, GroupMember, CreateGroupData, GroupWithMembers } from "../types"

export class GroupModel {
  // Create new group
  static async create(groupData: CreateGroupData): Promise<number> {
    const query = `
      INSERT INTO groups (name, description, created_by)
      VALUES (?, ?, ?)
    `

    const groupId = await executeInsert(query, [groupData.name, groupData.description || null, groupData.created_by])

    // Add creator as first member
    await this.addMember(groupId, groupData.created_by)

    return groupId
  }

  // Get group by ID with members
  static async findById(id: number): Promise<GroupWithMembers | null> {
    const groupQuery = `
      SELECT g.*, u.name as created_by_name
      FROM groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.id = ? AND g.is_active = TRUE
    `

    const group = await executeQuerySingle<Group & { created_by_name: string }>(groupQuery, [id])
    if (!group) return null

    const membersQuery = `
      SELECT gm.*, u.name as user_name, u.email as user_email
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at
    `

    const members = await executeQuery<GroupMember & { user_name: string; user_email: string }>(membersQuery, [id])

    return {
      ...group,
      members,
      member_count: members.length,
    } as GroupWithMembers
  }

  // Get user's groups
  static async getUserGroups(userId: number): Promise<GroupWithMembers[]> {
    const query = `
      SELECT g.*, u.name as created_by_name,
             COUNT(gm2.user_id) as member_count
      FROM groups g
      JOIN users u ON g.created_by = u.id
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id
      WHERE gm.user_id = ? AND g.is_active = TRUE
      GROUP BY g.id, g.name, g.description, g.created_by, g.is_active, g.created_at, g.updated_at, u.name
      ORDER BY g.updated_at DESC
    `

    const groups = await executeQuery<Group & { created_by_name: string; member_count: number }>(query, [userId])

    // Get members for each group
    const groupsWithMembers: GroupWithMembers[] = []
    for (const group of groups) {
      const membersQuery = `
        SELECT gm.*, u.name as user_name, u.email as user_email
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at
      `

      const members = await executeQuery<GroupMember & { user_name: string; user_email: string }>(membersQuery, [
        group.id,
      ])

      groupsWithMembers.push({
        ...group,
        members,
      } as GroupWithMembers)
    }

    return groupsWithMembers
  }

  // Add member to group
  static async addMember(groupId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        INSERT INTO group_members (group_id, user_id)
        VALUES (?, ?)
      `
      await executeInsert(query, [groupId, userId])
      return true
    } catch (error) {
      // Handle duplicate key error
      return false
    }
  }

  // Remove member from group
  static async removeMember(groupId: number, userId: number): Promise<boolean> {
    const query = "DELETE FROM group_members WHERE group_id = ? AND user_id = ?"
    const result = await executeQuery(query, [groupId, userId])
    return (result as any).affectedRows > 0
  }

  // Check if user is member of group
  static async isMember(groupId: number, userId: number): Promise<boolean> {
    const query = "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    const result = await executeQuerySingle(query, [groupId, userId])
    return result !== null
  }

  // Update group
  static async update(id: number, data: Partial<CreateGroupData>): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.name) {
      fields.push("name = ?")
      values.push(data.name)
    }
    if (data.description !== undefined) {
      fields.push("description = ?")
      values.push(data.description)
    }

    if (fields.length === 0) return false

    values.push(id)
    const query = `UPDATE groups SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(query, values)
    return (result as any).affectedRows > 0
  }

  // Delete group (soft delete)
  static async delete(id: number): Promise<boolean> {
    const query = "UPDATE groups SET is_active = FALSE WHERE id = ?"
    const result = await executeQuery(query, [id])
    return (result as any).affectedRows > 0
  }
}

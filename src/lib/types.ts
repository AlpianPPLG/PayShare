/* eslint-disable @typescript-eslint/no-explicit-any */

// User types
export interface User {
    id: number
    name: string
    email: string
    password: string
    phone?: string
    avatar_url?: string
    is_active: boolean
    created_at: Date
    updated_at: Date
  }
  
  export interface CreateUserData {
    name: string
    email: string
    password: string
    phone?: string
    avatar_url?: string
  }
  
  // Group types
  export interface Group {
    id: number
    name: string
    description?: string
    created_by: number
    is_active: boolean
    created_at: Date
    updated_at: Date
  }
  
  export interface CreateGroupData {
    name: string
    description?: string
    created_by: number
  }
  
  // Group member types
  export interface GroupMember {
    id: number
    group_id: number
    user_id: number
    joined_at: Date
  }
  
  // Expense types
  export interface Expense {
    id: number
    title: string
    description?: string
    total_amount: number
    currency: string
    category: string
    group_id?: number
    paid_by: number
    split_method: "equal" | "exact" | "percentage"
    expense_date: Date
    created_by: number
    created_at: Date
    updated_at: Date
  }
  
  export interface CreateExpenseData {
    title: string
    description?: string
    total_amount: number
    currency?: string
    category?: string
    group_id?: number
    paid_by: number
    split_method?: "equal" | "exact" | "percentage"
    expense_date: Date
    created_by: number
  }
  
  // Expense participant types
  export interface ExpenseParticipant {
    user_name: string
    user_email: string
    id: number
    expense_id: number
    user_id: number
    amount_owed: number
    percentage?: number
    is_settled: boolean
    settled_at?: Date
  }
  
  export interface CreateExpenseParticipantData {
    expense_id: number
    user_id: number
    amount_owed: number
    percentage?: number
  }
  
  // Settlement types
  export interface Settlement {
    id: number
    from_user_id: number
    to_user_id: number
    from_user_name: string
    to_user_name: string
    amount: number
    currency: string
    expense_id?: number
    expense_title?: string
    notes?: string
    settlement_date: Date
    created_by: number
    created_at: Date
  }
  
  export interface CreateSettlementData {
    from_user_id: number
    to_user_id: number
    amount: number
    currency?: string
    expense_id?: number
    notes?: string
    settlement_date: Date
    created_by: number
  }
  
  // Balance types
  export interface Balance {
    id: number
    user_id: number
    with_user_id: number
    balance: number
    group_id?: number
    last_updated: Date
  }
  
  // Category types
  export interface Category {
    id: number
    name: string
    icon?: string
    color?: string
    created_at: Date
  }
  
  // Extended types with joined data
  export interface ExpenseWithDetails extends Expense {
    paid_by_name: string
    paid_by_email: string
    group_name?: string
    participants: ExpenseParticipant[]
  }
  
  export interface GroupWithMembers extends Group {
    created_by_name: string
    members: (GroupMember & { user_name: string; user_email: string })[]
    member_count: number
  }
  
  export interface UserBalance {
    user_id: number
    user_name: string
    user_email: string
    total_owed: number
    total_owes: number
    net_balance: number
  }
  
  // API Response types
  export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: string
  }
  
  // Authentication types
  export interface LoginCredentials {
    email: string
    password: string
  }
  
  export interface RegisterData {
    name: string
    email: string
    password: string
    phone?: string
  }
  
  export interface AuthUser {
    id: number
    name: string
    email: string
    phone?: string
    avatar_url?: string
  }
  
  export interface JWTPayload {
    userId: number
    email: string
    iat?: number
    exp?: number
  }
  
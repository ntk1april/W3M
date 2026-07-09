export type AccountType = 'BANK' | 'WALLET' | 'CASH'
export type TransactionType = 'INCOME' | 'EXPENSE'

export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  currency: string
  darkMode: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  balance: number
  color: string
  icon: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  userId: string
  name: string
  type: TransactionType
  icon: string
  color: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  accountId: string
  categoryId: string
  type: TransactionType
  title: string
  amount: number
  note?: string
  receipt?: string
  date: Date
  createdAt: Date
  updatedAt: Date
  account?: Account
  category?: Category
}

export interface DashboardStats {
  totalBalance: number
  todayExpense: number
  monthExpense: number
  yearExpense: number
  accounts: Account[]
  recentTransactions: Transaction[]
}

export interface SpendingByCategory {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  amount: number
  percentage: number
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
  net: number
}

export interface DaySpending {
  date: string
  amount: number
  transactions: Transaction[]
}

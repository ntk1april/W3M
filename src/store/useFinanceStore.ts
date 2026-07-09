import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Account, Transaction, Category, User } from '@/types'

interface FinanceStore {
  // User
  user: User | null
  setUser: (user: User | null) => void

  // Accounts
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (account: Account) => void
  deleteAccount: (id: string) => void

  // Transactions
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: string) => void

  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void

  // UI State
  isAddTransactionOpen: boolean
  setIsAddTransactionOpen: (open: boolean) => void
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void

  // Computed
  getTotalBalance: () => number
  getTodayExpense: () => number
  getMonthExpense: () => number
  getYearExpense: () => number
}

export const useFinanceStore = create<FinanceStore>()(
  devtools(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),

      accounts: [],
      setAccounts: (accounts) => set({ accounts }),
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (account) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
        })),
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (transaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transaction.id ? transaction : t
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      categories: [],
      setCategories: (categories) => set({ categories }),

      isAddTransactionOpen: false,
      setIsAddTransactionOpen: (open) => set({ isAddTransactionOpen: open }),
      selectedDate: null,
      setSelectedDate: (date) => set({ selectedDate: date }),

      getTotalBalance: () => {
        const { accounts } = get()
        return accounts.reduce((sum, acc) => sum + acc.balance, 0)
      },

      getTodayExpense: () => {
        const { transactions } = get()
        const today = new Date()
        return transactions
          .filter(
            (t) =>
              t.type === 'EXPENSE' &&
              new Date(t.date).toDateString() === today.toDateString()
          )
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getMonthExpense: () => {
        const { transactions } = get()
        const now = new Date()
        return transactions
          .filter(
            (t) =>
              t.type === 'EXPENSE' &&
              new Date(t.date).getMonth() === now.getMonth() &&
              new Date(t.date).getFullYear() === now.getFullYear()
          )
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getYearExpense: () => {
        const { transactions } = get()
        const now = new Date()
        return transactions
          .filter(
            (t) =>
              t.type === 'EXPENSE' &&
              new Date(t.date).getFullYear() === now.getFullYear()
          )
          .reduce((sum, t) => sum + t.amount, 0)
      },
    }),
    { name: 'finance-store' }
  )
)

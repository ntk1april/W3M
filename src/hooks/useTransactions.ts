import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Transaction } from '@/types'
import { toast } from 'sonner'

interface TransactionFilters {
  limit?: number
  offset?: number
  type?: string
  accountId?: string
  categoryId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export function useTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams()
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))
  if (filters.type) params.set('type', filters.type)
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.search) params.set('search', filters.search)

  return useQuery<{ transactions: Transaction[]; total: number }>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'account' | 'category'>) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to create transaction')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction added! 💸')
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to add transaction'),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Transaction> & { id: string }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update transaction')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction updated')
    },
    onError: () => toast.error('Failed to update transaction'),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete transaction')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction deleted')
    },
    onError: () => toast.error('Failed to delete transaction'),
  })
}

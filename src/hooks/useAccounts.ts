import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Account } from '@/types'
import { toast } from 'sonner'

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts')
      if (!res.ok) throw new Error('Failed to fetch accounts')
      return res.json()
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>) => {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Account created successfully')
    },
    onError: () => toast.error('Failed to create account'),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Account> & { id: string }) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Account updated')
    },
    onError: () => toast.error('Failed to update account'),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Account deleted')
    },
    onError: () => toast.error('Failed to delete account'),
  })
}

export function useReorderAccounts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (accountIds: string[]) => {
      const res = await fetch('/api/accounts/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds }),
      })
      if (!res.ok) throw new Error('Failed to reorder accounts')
      return res.json()
    },
    onMutate: async (newOrderIds) => {
      await queryClient.cancelQueries({ queryKey: ['accounts'] })
      const previousAccounts = queryClient.getQueryData<Account[]>(['accounts'])
      if (previousAccounts) {
        const newAccounts = [...previousAccounts].sort((a, b) => 
          newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id)
        )
        queryClient.setQueryData(['accounts'], newAccounts)
      }
      return { previousAccounts }
    },
    onError: (err, newOrderIds, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }
      toast.error('Failed to save account order')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    }
  })
}

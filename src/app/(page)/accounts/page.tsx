'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, Trash2, Wallet, Loader2, X, GripVertical } from 'lucide-react'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useReorderAccounts } from '@/hooks/useAccounts'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { accountSchema, type AccountInput } from '@/lib/validations'
import { formatCurrency, ACCOUNT_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Account } from '@/types'

type AccountType = 'BANK' | 'WALLET' | 'CASH'

const accountTypes: { value: AccountType; label: string; icon: string; desc: string }[] = [
  { value: 'BANK', label: 'Bank', icon: '🏦', desc: 'Savings/Checking account' },
  { value: 'WALLET', label: 'Wallet', icon: '👛', desc: 'Digital wallet' },
  { value: 'CASH', label: 'Cash', icon: '💵', desc: 'Physical cash' },
]

function AccountFormDialog({
  open,
  onClose,
  editAccount,
}: {
  open: boolean
  onClose: () => void
  editAccount?: Account
}) {
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: editAccount
      ? {
          name: editAccount.name,
          type: editAccount.type,
          balance: editAccount.balance,
          color: editAccount.color,
          icon: editAccount.icon,
        }
      : {
          type: 'BANK',
          color: ACCOUNT_COLORS[0],
          icon: 'bank',
          balance: 0,
        },
  })

  const selectedType = watch('type')
  const selectedColor = watch('color')

  const onSubmit = async (data: AccountInput) => {
    if (editAccount) {
      await updateAccount.mutateAsync({ id: editAccount.id, ...data })
    } else {
      await createAccount.mutateAsync(data)
    }
    onClose()
    reset()
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border animate-fade-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="font-bold text-lg">{editAccount ? 'Edit Account' : 'Add Account'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5 overflow-y-auto">
          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {accountTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue('type', type.value)}
                  className={cn(
                    'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all',
                    selectedType === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Account Name</label>
            <input
              {...register('name')}
              placeholder="e.g. Kasikorn, TrueMoney, Cash"
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                errors.name && 'border-destructive'
              )}
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium mb-2">Initial Balance</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">฿</span>
              <input
                {...register('balance', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                  errors.balance && 'border-destructive'
                )}
              />
            </div>
            {errors.balance && <p className="text-destructive text-xs mt-1">{errors.balance.message}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
                  )}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {watch('name') && (
            <div className="p-3 rounded-xl border border-border flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${selectedColor}22` }}
              >
                {selectedType === 'BANK' ? '🏦' : selectedType === 'WALLET' ? '👛' : '💵'}
              </div>
              <div>
                <p className="font-semibold text-sm">{watch('name')}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(watch('balance') || 0)}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || createAccount.isPending || updateAccount.isPending}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            {(isSubmitting || createAccount.isPending || updateAccount.isPending) ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>{editAccount ? 'Update Account' : 'Create Account'}</>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}

function SortableAccountCard({ account, onEdit, onDelete }: { account: Account, onEdit: () => void, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-2xl border border-border p-5 relative overflow-hidden group",
        isDragging ? "shadow-2xl ring-2 ring-primary" : "card-hover"
      )}
    >
      <div
        className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10"
        style={{ background: account.color }}
      />
      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-muted p-1 -ml-2 rounded text-muted-foreground hover:text-foreground touch-none"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${account.color}22` }}
            >
              {account.type === 'BANK' ? '🏦' : account.type === 'WALLET' ? '👛' : '💵'}
            </div>
            <div>
              <p className="font-bold">{account.name}</p>
              <span className="text-xs text-muted-foreground">{account.type}</span>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>
        <div className="h-1 rounded-full mb-4" style={{ background: account.color }} />
        <div className="mt-auto">
          <p className="text-xs text-muted-foreground mb-1">Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
        </div>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>()

  const totalBalance = accounts.reduce((sum: number, acc: Account) => sum + acc.balance, 0)

  const reorderAccounts = useReorderAccounts()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = accounts.findIndex((a: Account) => a.id === active.id)
      const newIndex = accounts.findIndex((a: Account) => a.id === over.id)
      
      const newOrderIds = arrayMove(accounts, oldIndex, newIndex).map((a: Account) => a.id)
      reorderAccounts.mutate(newOrderIds)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Total across all accounts</p>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </div>
        <button
          onClick={() => { setEditingAccount(undefined); setDialogOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No accounts yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your bank accounts, wallets, and cash to start tracking your finances
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="px-6 py-2.5 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={accounts.map((a: Account) => a.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account: Account) => (
                <SortableAccountCard 
                  key={account.id} 
                  account={account} 
                  onEdit={() => { setEditingAccount(account); setDialogOpen(true) }}
                  onDelete={() => {
                    if (confirm('Delete this account? All transactions will also be deleted.')) {
                      deleteAccount.mutate(account.id)
                    }
                  }}
                />
              ))}

              <button
                onClick={() => { setEditingAccount(undefined); setDialogOpen(true) }}
                className="bg-card rounded-2xl border-2 border-dashed border-border p-5 flex flex-col items-center
                  justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-muted-foreground
                  hover:text-primary min-h-[160px]"
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Add Account</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Form Dialog */}
      {dialogOpen && (
        <AccountFormDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingAccount(undefined) }}
          editAccount={editingAccount}
        />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, TrendingDown, TrendingUp, ChevronLeft, Loader2, Calendar, CheckCircle2 } from 'lucide-react'
import { transactionSchema, type TransactionInput } from '@/lib/validations'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useDashboard'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import type { Category, Account } from '@/types'

type Step = 1 | 2 | 3

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTransactionDialog({ open, onOpenChange }: AddTransactionDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const createTransaction = useCreateTransaction()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date(),
    },
  })

  const selectedType = watch('type')
  const selectedCategoryId = watch('categoryId')
  const selectedAccountId = watch('accountId')
  const amount = watch('amount')

  const filteredCategories = categories.filter(
    (c: Category) => c.type === selectedType
  )
  const selectedCategory = categories.find((c: Category) => c.id === selectedCategoryId)
  const selectedAccount = accounts.find((a: Account) => a.id === selectedAccountId)

  const handleClose = () => {
    onOpenChange(false)
    setStep(1)
    reset()
  }

  const onSubmit = async (data: TransactionInput) => {
    await createTransaction.mutateAsync({
      ...data,
      amount: Number(data.amount),
    })
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl
        shadow-2xl border border-border overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((prev) => (prev - 1) as Step)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-lg">Add Transaction</h2>
              <p className="text-xs text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex px-5 pt-4 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="p-5 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Choose transaction type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setValue('type', 'EXPENSE')
                    setValue('categoryId', '')
                  }}
                  className={cn(
                    'p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200',
                    selectedType === 'EXPENSE'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
                    selectedType === 'EXPENSE' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted'
                  )}>
                    💸
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Expense</p>
                    <p className="text-xs text-muted-foreground">Money going out</p>
                  </div>
                  {selectedType === 'EXPENSE' && (
                    <CheckCircle2 className="w-5 h-5 text-red-500 absolute top-3 right-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setValue('type', 'INCOME')
                    setValue('categoryId', '')
                  }}
                  className={cn(
                    'p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 relative',
                    selectedType === 'INCOME'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
                    selectedType === 'INCOME' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-muted'
                  )}>
                    💰
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Income</p>
                    <p className="text-xs text-muted-foreground">Money coming in</p>
                  </div>
                  {selectedType === 'INCOME' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 absolute top-3 right-3" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl font-semibold text-white mt-2"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Category Selection */}
          {step === 2 && (
            <div className="p-5 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Select a {selectedType.toLowerCase()} category
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredCategories.map((category: Category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setValue('categoryId', category.id)
                      setStep(3)
                    }}
                    className={cn(
                      'p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200',
                      selectedCategoryId === category.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted'
                    )}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                  </button>
                ))}
              </div>
              {errors.categoryId && (
                <p className="text-destructive text-xs">{errors.categoryId.message}</p>
              )}
            </div>
          )}

          {/* Step 3: Transaction Details */}
          {step === 3 && (
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Selected type & category summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-xl">{selectedCategory?.icon}</span>
                <div>
                  <p className="font-medium text-sm">{selectedCategory?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selectedType.toLowerCase()}</p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">฿</span>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-foreground text-xl font-bold',
                      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                      errors.amount && 'border-destructive'
                    )}
                  />
                </div>
                {errors.amount && (
                  <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Transaction Name</label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="e.g. Lunch at MK Restaurant"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    errors.title && 'border-destructive'
                  )}
                />
                {errors.title && (
                  <p className="text-destructive text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border bg-card text-foreground
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  )}
                />
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium mb-2">Payment Account</label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map((account: Account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => field.onChange(account.id)}
                          className={cn(
                            'p-3 rounded-xl border text-left transition-all',
                            field.value === account.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:bg-muted'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: account.color }} />
                            <span className="text-sm font-medium truncate">{account.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(account.balance)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.accountId && (
                  <p className="text-destructive text-xs mt-1">{errors.accountId.message}</p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Note <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  {...register('note')}
                  rows={2}
                  placeholder="Add a note..."
                  className="w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={createTransaction.isPending}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2',
                  'disabled:opacity-60 shadow-lg transition-all'
                )}
                style={{
                  background: selectedType === 'EXPENSE'
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'linear-gradient(135deg, #22C55E, #16A34A)'
                }}
              >
                {createTransaction.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {selectedType === 'EXPENSE' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    Save {selectedType === 'EXPENSE' ? 'Expense' : 'Income'}
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

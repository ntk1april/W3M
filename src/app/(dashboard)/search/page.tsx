'use client'

import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Search, Loader2, Filter } from 'lucide-react'
import type { Transaction } from '@/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useTransactions({
    search: debouncedQuery,
    type: typeFilter || undefined,
    limit: 50,
  })
  const transactions = data?.transactions || []

  const handleSearch = (value: string) => {
    setQuery(value)
    clearTimeout((window as typeof window & { st?: ReturnType<typeof setTimeout> }).st)
    ;(window as typeof window & { st?: ReturnType<typeof setTimeout> }).st = setTimeout(() => {
      setDebouncedQuery(value)
    }, 400)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Search</h1>
        <p className="text-muted-foreground text-sm">Find any transaction instantly</p>
      </div>

      {/* Search Input */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, category, amount..."
            autoFocus
            className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-card text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg shadow-sm"
          />
          {isLoading && debouncedQuery && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex gap-2">
          {['All', 'INCOME', 'EXPENSE'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type === 'All' ? '' : type)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm font-medium transition-all border',
                typeFilter === (type === 'All' ? '' : type)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!debouncedQuery ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Start typing to search</p>
          <p className="text-sm mt-1">Search by name, category, or account</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">No results for &quot;{debouncedQuery}&quot;</p>
          <p className="text-sm mt-1">Try different keywords</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{data?.total}</span> results
            </p>
          </div>
          <div className="divide-y divide-border">
            {transactions.map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                  {transaction.category?.icon || '💸'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {/* Highlight search term */}
                    {transaction.title.split(new RegExp(`(${debouncedQuery})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === debouncedQuery.toLowerCase()
                        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
                        : part
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{transaction.category?.name}</span>
                    <span>·</span>
                    <span>{transaction.account?.name}</span>
                    <span>·</span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    'font-bold text-sm',
                    transaction.type === 'INCOME'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    transaction.type === 'INCOME' ? 'badge-income' : 'badge-expense'
                  )}>
                    {transaction.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

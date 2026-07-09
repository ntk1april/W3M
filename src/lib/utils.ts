import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  return `฿${formatted}`
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm')
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getMonthYear(date: Date | string): string {
  return format(new Date(date), 'MMMM yyyy')
}

export function getDayKey(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM-dd')
}

export const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍜', color: '#F59E0B' },
  { name: 'Coffee', icon: '☕', color: '#92400E' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { name: 'Travel', icon: '✈️', color: '#6366F1' },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { name: 'Bills', icon: '📄', color: '#EF4444' },
  { name: 'Investment', icon: '📈', color: '#22C55E' },
  { name: 'Healthcare', icon: '🏥', color: '#14B8A6' },
  { name: 'Education', icon: '📚', color: '#F97316' },
  { name: 'Others', icon: '📦', color: '#6B7280' },
]

export const INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#22C55E' },
  { name: 'Bonus', icon: '🎁', color: '#10B981' },
  { name: 'Freelance', icon: '💻', color: '#3B82F6' },
  { name: 'Investment', icon: '📈', color: '#6366F1' },
  { name: 'Gift', icon: '🎀', color: '#EC4899' },
  { name: 'Refund', icon: '↩️', color: '#F59E0B' },
  { name: 'Others', icon: '💼', color: '#6B7280' },
]

export const ACCOUNT_ICONS = [
  { name: 'wallet', icon: '👛' },
  { name: 'bank', icon: '🏦' },
  { name: 'cash', icon: '💵' },
  { name: 'card', icon: '💳' },
  { name: 'savings', icon: '🐷' },
  { name: 'investment', icon: '📈' },
]

export const ACCOUNT_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#16A34A', '#0891B2', '#7C2D12',
  '#1D4ED8', '#6D28D9', '#BE185D', '#991B1B',
]

export function generateGradient(color: string): string {
  return `linear-gradient(135deg, ${color}22, ${color}44)`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

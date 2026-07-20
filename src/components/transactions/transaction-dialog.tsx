"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Edit2, Trash2, Loader2 } from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  date,
  onEdit,
}: TransactionDialogProps) {
  const [mounted, setMounted] = useState(false);

  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).toISOString();
  const endDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
  ).toISOString();

  const { data, isLoading } = useTransactions({
    startDate,
    endDate,
    limit: 100,
  });

  const deleteTransaction = useDeleteTransaction();

  const handleClose = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const transactions = (data?.transactions || []).filter(
    (t: Transaction) => t.type !== "TRANSFER",
  );

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-full sm:max-w-xl bg-card rounded-t-3xl sm:rounded-2xl
        shadow-2xl border border-border overflow-hidden animate-fade-in flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-bold text-lg">
                Transactions on {formatDate(date)}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction list */}
        <div className="overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No transactions on this date.</p>
            </div>
          ) : (
            transactions.map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                  {transaction.type === "TRANSFER"
                    ? "🔄"
                    : transaction.category?.icon || "💸"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {transaction.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {transaction.type === "TRANSFER"
                      ? `${transaction.account?.name} → ${transaction.toAccount?.name}`
                      : transaction.category?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(transaction.date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "font-bold text-sm",
                      transaction.type === "INCOME"
                        ? "text-green-600 dark:text-green-400"
                        : transaction.type === "TRANSFER"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {transaction.type === "INCOME"
                      ? "+"
                      : transaction.type === "TRANSFER"
                        ? ""
                        : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex gap-1 justify-end mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this transaction?"))
                          deleteTransaction.mutate(transaction.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="flex items-center justify-between p-2 mt-4 border-t border-border shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-bold text-lg">Total expense:</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-bold text-lg text-red-600 dark:text-red-400">
                  {formatCurrency(
                    transactions.reduce(
                      (acc: number, t: Transaction) =>
                        acc + (t.type === "EXPENSE" ? t.amount : 0),
                      0,
                    ),
                  )}
                </h2>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 border-border shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-bold text-lg">Total income:</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(
                    transactions.reduce(
                      (acc: number, t: Transaction) =>
                        acc + (t.type === "INCOME" ? t.amount : 0),
                      0,
                    ),
                  )}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

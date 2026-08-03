"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useDashboard";
import { useUpdateTransaction } from "@/hooks/useTransactions";
import { cn, formatCurrency, getDayKey } from "@/lib/utils";
import type { Category, Account, Transaction } from "@/types";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit: Transaction;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transactionToEdit,
}: EditTransactionDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [showAllToAccounts, setShowAllToAccounts] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const updateTransaction = useUpdateTransaction();

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
      type: "EXPENSE",
      date: new Date(),
    },
  });

  useEffect(() => {
    if (open && transactionToEdit) {
      reset({
        title: transactionToEdit.title,
        amount: String(transactionToEdit.amount) as unknown as number,
        type: transactionToEdit.type,
        categoryId: transactionToEdit.categoryId || "",
        accountId: transactionToEdit.accountId,
        toAccountId: transactionToEdit.toAccountId || "",
        date: new Date(transactionToEdit.date),
      });
      setShowAllAccounts(false);
      setShowAllToAccounts(false);
    }
  }, [open, transactionToEdit, reset]);

  const selectedType = watch("type");
  const selectedCategoryId = watch("categoryId");
  const selectedAccountId = watch("accountId");
  const watchAmount = watch("amount");
  const inputAmount =
    typeof watchAmount === "number" ? watchAmount : parseFloat(watchAmount) || 0;

  const getBaseBalance = (account: Account) => {
    if (!transactionToEdit) return account.balance;
    const origAmount = transactionToEdit.amount || 0;
    const origType = transactionToEdit.type;
    const origAccountId = transactionToEdit.accountId;
    const origToAccountId = transactionToEdit.toAccountId;

    if (origType === "EXPENSE" && account.id === origAccountId) {
      return account.balance + origAmount;
    }
    if (origType === "INCOME" && account.id === origAccountId) {
      return account.balance - origAmount;
    }
    if (origType === "TRANSFER") {
      if (account.id === origAccountId) {
        return account.balance + origAmount;
      }
      if (account.id === origToAccountId) {
        return account.balance - origAmount;
      }
    }
    return account.balance;
  };

  const selectedAccount = accounts.find((a: Account) => a.id === selectedAccountId);
  const isInsufficientFunds = selectedAccount && 
    (selectedType === "EXPENSE" || selectedType === "TRANSFER") && 
    inputAmount > 0 && 
    getBaseBalance(selectedAccount) < inputAmount;

  const getProjectedBalance = (account: Account, isSource: boolean) => {
    if (!inputAmount || inputAmount <= 0) return null;
    const base = getBaseBalance(account);
    if (selectedType === "EXPENSE") {
      return base - inputAmount;
    }
    if (selectedType === "INCOME") {
      return base + inputAmount;
    }
    if (selectedType === "TRANSFER") {
      return isSource ? base - inputAmount : base + inputAmount;
    }
    return null;
  };

  const filteredCategories = categories.filter(
    (c: Category) => c.type === selectedType,
  );

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = async (data: TransactionInput) => {
    await updateTransaction.mutateAsync({
      id: transactionToEdit.id,
      ...data,
      amount: Number(data.amount),
    });
    handleClose();
  };

  useEffect(() => { setMounted(true) }, [])

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl
        shadow-2xl border border-border overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-bold text-lg">Edit Transaction</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Category Dropdown (if not transfer) */}
            {selectedType !== "TRANSFER" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border bg-card text-foreground text-left flex justify-between items-center",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                          errors.categoryId && "border-destructive",
                        )}
                      >
                        {field.value ? (
                          (() => {
                            const selected = filteredCategories.find(
                              (c: Category) => c.id === field.value,
                            );
                            return (
                              <span className="flex items-center gap-2">
                                <span>{selected?.icon}</span>
                                <span>{selected?.name}</span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground">
                            Select category...
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">▼</span>
                      </button>

                      {isCategoryOpen && (
                        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-xl shadow-xl max-h-72 overflow-y-auto p-3 grid grid-cols-3 gap-2">
                          {filteredCategories.map((c: Category) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                field.onChange(c.id);
                                setIsCategoryOpen(false);
                              }}
                              className={cn(
                                "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200",
                                field.value === c.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-muted-foreground/30 hover:bg-muted",
                              )}
                            >
                              <span className="text-2xl">{c.icon}</span>
                              <span className="text-xs font-medium text-center leading-tight">
                                {c.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  ฿
                </span>
                <input
                  {...register("amount", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-foreground text-xl font-bold",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.amount && "border-destructive",
                  )}
                />
              </div>
              {errors.amount && (
                <p className="text-destructive text-xs mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Transaction Name
              </label>
              <input
                {...register("title")}
                type="text"
                placeholder="e.g. Lunch at MK Restaurant"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                  errors.title && "border-destructive",
                )}
              />
              {errors.title && (
                <p className="text-destructive text-xs mt-1">
                  {errors.title.message}
                </p>
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
                    value={
                      field.value ? getDayKey(field.value) : ""
                    }
                    onChange={(e) => field.onChange(new Date(`${e.target.value}T00:00:00`))}
                    className="w-full px-4 py-3 rounded-xl border bg-card text-foreground
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                )}
              />
            </div>

            {/* Account Selection */}
            <div className="space-y-4">
              {/* Source Account */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedType === "TRANSFER" ? "From Account" : "Account"}
                </label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => {
                    const visibleAccounts = showAllAccounts
                      ? accounts
                      : accounts.slice(0, 4);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {visibleAccounts.map((account: Account) => {
                            const projected = getProjectedBalance(account, true);
                            return (
                              <button
                                key={account.id}
                                type="button"
                                onClick={() => field.onChange(account.id)}
                                className={cn(
                                  "p-3 rounded-xl border text-left transition-all",
                                  field.value === account.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:bg-muted",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ background: account.color }}
                                  />
                                  <span className="text-sm font-medium truncate">
                                    {account.name}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                                  <span>{formatCurrency(account.balance)}</span>
                                  {projected !== null && (
                                    <>
                                      <span className="text-muted-foreground">→</span>
                                      <span
                                        className={cn(
                                          "font-bold",
                                          projected < 0
                                            ? "text-destructive"
                                            : selectedType === "INCOME"
                                              ? "text-green-600 dark:text-green-400"
                                              : "text-red-600 dark:text-red-400",
                                        )}
                                      >
                                        {formatCurrency(projected)}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                        {accounts.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setShowAllAccounts(!showAllAccounts)}
                            className="w-full mt-2 text-xs font-medium text-primary hover:underline text-center"
                          >
                            {showAllAccounts
                              ? "Show less ▲"
                              : `Show all accounts (${accounts.length}) ▼`}
                          </button>
                        )}
                      </>
                    );
                  }}
                />
                {errors.accountId && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.accountId.message}
                  </p>
                )}
              </div>

              {/* Destination Account (Only for TRANSFER) */}
              {selectedType === "TRANSFER" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    To Account
                  </label>
                  <Controller
                    name="toAccountId"
                    control={control}
                    render={({ field }) => {
                      const toAccountsList = accounts.filter(
                        (a) => a.id !== selectedAccountId,
                      );
                      const visibleToAccounts = showAllToAccounts
                        ? toAccountsList
                        : toAccountsList.slice(0, 4);
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {visibleToAccounts.map((account: Account) => {
                              const projected = getProjectedBalance(account, false);
                              return (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() => field.onChange(account.id)}
                                  className={cn(
                                    "p-3 rounded-xl border text-left transition-all",
                                    field.value === account.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:bg-muted",
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ background: account.color }}
                                    />
                                    <span className="text-sm font-medium truncate">
                                      {account.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                                    <span>{formatCurrency(account.balance)}</span>
                                    {projected !== null && (
                                      <>
                                        <span className="text-muted-foreground">→</span>
                                        <span
                                          className={cn(
                                            "font-bold",
                                            projected < 0
                                              ? "text-destructive"
                                              : "text-green-600 dark:text-green-400",
                                          )}
                                        >
                                          {formatCurrency(projected)}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                          {toAccountsList.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setShowAllToAccounts(!showAllToAccounts)}
                              className="w-full mt-2 text-xs font-medium text-primary hover:underline text-center"
                            >
                              {showAllToAccounts
                                ? "Show less ▲"
                                : `Show all accounts (${toAccountsList.length}) ▼`}
                            </button>
                          )}
                        </>
                      );
                    }}
                  />
                  {errors.toAccountId && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.toAccountId.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                {...register("note")}
                rows={2}
                placeholder="Add a note..."
                className="w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Submit */}
            {isInsufficientFunds && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center">
                Not enough balance in {selectedAccount.name}.
              </div>
            )}
            <button
              type="submit"
              disabled={
                updateTransaction.isPending ||
                !selectedAccountId ||
                (selectedType !== "TRANSFER" && !selectedCategoryId) ||
                (selectedType === "TRANSFER" && !watch("toAccountId")) ||
                !!isInsufficientFunds
              }
              className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {updateTransaction.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  , document.body);
}

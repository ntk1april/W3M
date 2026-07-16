"use client";

import { useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import { AddTransactionDialog } from "./add-transaction-dialog";

export function AddTransactionFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fab"
        onClick={() => setOpen(true)}
        title="Add Transaction"
        id="fab-add-transaction"
      >
        <ArrowLeftRight className="w-6 h-6" />
      </button>
      <AddTransactionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

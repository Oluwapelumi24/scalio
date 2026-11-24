'use client'

import { useActionState, useTransition } from 'react'
import { addExpense, voidExpense } from '@/app/actions/finance'
import { useAskConfirm } from '@/components/askConfirm'
import { SelectMenu } from '@/components/SelectMenu'

export function ExpenseForm({ categories, today }: { categories: string[]; today: string }) {
  const [state, action, isPending] = useActionState(addExpense, null)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-gray-700">
        Amount (₦)
        <input name="amount" inputMode="decimal" required className="mt-1 block w-32 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900" />
      </label>
      <label className="text-sm text-gray-700">
        Category
        <SelectMenu
          name="category"
          defaultValue={categories[0]}
          className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          options={categories.map((category) => ({ value: category, label: category }))}
        />
      </label>
      <label className="text-sm text-gray-700">
        Date
        <input name="spentOn" type="date" defaultValue={today} max={today} required className="mt-1 block rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900" />
      </label>
      <label className="text-sm text-gray-700 flex-1 min-w-48">
        Note
        <input name="note" maxLength={200} placeholder="Optional" className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? 'Adding…' : 'Add expense'}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  )
}

export function VoidButton({ id, label }: { id: string; label: string }) {
  const { askConfirm, dialog } = useAskConfirm()
  const [isPending, startTransition] = useTransition()
  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          void (async () => {
            if (!(await askConfirm(`Remove ${label}?`, 'Remove'))) return
            startTransition(async () => { await voidExpense(id) })
          })()
        }}
        className="text-xs font-medium text-red-600 hover:text-red-800"
      >
        Remove
      </button>
      {dialog}
    </>
  )
}

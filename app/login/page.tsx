"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold mb-1">Project Ops</h1>
        <p className="text-sm text-neutral-500 mb-6">Sign in with your approved company email.</p>
        <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          <label className="text-sm block">
            Email
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            />
          </label>
          <label className="text-sm block">
            Password
            <input
              name="password"
              type="password"
              required
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            />
          </label>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-neutral-900 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-neutral-400 mt-4">
          No public sign-up — accounts are created by your administrator.
        </p>
      </div>
    </div>
  );
}

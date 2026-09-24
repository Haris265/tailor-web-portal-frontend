"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scissors } from "lucide-react";
import { login } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/");
      return;
    }
    setChecking(false);
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch {
      setError("Invalid username or password.");
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f6f8] px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 10%, rgba(166,124,82,0.12), transparent 45%), radial-gradient(ellipse at 90% 80%, rgba(21,32,43,0.05), transparent 40%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(166,124,82,0.12)] text-[#a67c52] shadow-sm">
            <Scissors className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h1 className="font-serif text-3xl tracking-tight text-[#15202b]">
            Men&apos;s Tailor Shop
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to open your shop portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel space-y-4 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Username
            </label>
            <input
              autoFocus
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-pro"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-pro"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

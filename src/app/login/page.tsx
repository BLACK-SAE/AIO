"use client";
import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const r = useRouter();
  const sp = useSearchParams();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  async function submit(code: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code })
      });
      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setDigits(Array(PIN_LENGTH).fill(""));
        refs.current[0]?.focus();
        throw new Error("Incorrect passcode");
      }
      const next = sp.get("next") || "/";
      r.push(next);
      r.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onChange(i: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < PIN_LENGTH - 1) refs.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === PIN_LENGTH) {
      submit(next.join(""));
    }
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < PIN_LENGTH - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    const focusIdx = Math.min(text.length, PIN_LENGTH - 1);
    refs.current[focusIdx]?.focus();
    if (text.length === PIN_LENGTH) submit(text);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.1),transparent_50%)]" />

      <div className={`relative w-full max-w-md ${shake ? "animate-shake" : ""}`}>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AIO Docs</h1>
            <p className="text-sm text-white/60 mt-1">Enter your access code to continue</p>
          </div>

          <div className="flex justify-center gap-2 md:gap-3 mb-6">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                disabled={loading}
                className="w-11 h-14 md:w-12 md:h-16 text-center text-2xl font-bold
                  bg-white/5 border-2 border-white/20 rounded-xl text-white
                  focus:outline-none focus:border-indigo-400 focus:bg-white/10
                  transition-all duration-150 caret-transparent
                  disabled:opacity-50"
              />
            ))}
          </div>

          <div className="h-6 text-center">
            {loading && (
              <div className="inline-flex items-center gap-2 text-white/70 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </div>
            )}
            {error && !loading && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">Protected area · Authorized personnel only</p>
      </div>

    </div>
  );
}

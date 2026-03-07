"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session) router.replace("/");
    });
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border-2 border-gray-200 rounded-[2rem] p-8 sm:p-10 shadow-sm">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-blue-600">WordMaster.</h1>
        <p className="text-sm text-gray-500 font-bold mb-8 uppercase tracking-widest">Sign In</p>

        {errorMsg && <div className="mb-5 p-3 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-xl text-sm">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full p-4 border-2 rounded-2xl font-bold outline-none bg-gray-50 border-gray-100 focus:border-blue-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full p-4 border-2 rounded-2xl font-bold outline-none bg-gray-50 border-gray-100 focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

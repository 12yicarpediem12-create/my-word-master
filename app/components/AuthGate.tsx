"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import { clearAuthAccessTokenCookie, setAuthAccessTokenCookie } from "@/app/lib/auth-cookie";

type AuthGateProps = {
  children: React.ReactNode;
};

const PUBLIC_ROUTES = new Set(["/login"]);

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    const applySession = async (session: Session | null) => {
      if (!isMounted) return;
      const isPublic = PUBLIC_ROUTES.has(pathname);

      if (session?.access_token) {
        setAuthAccessTokenCookie(session.access_token, session.expires_at);
        setIsReady(true);
        if (isPublic) {
          router.replace("/");
        }
        return;
      }

      clearAuthAccessTokenCookie();
      setIsReady(isPublic);
      if (!isPublic) {
        router.replace("/login");
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  if (!isReady && !PUBLIC_ROUTES.has(pathname)) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-500 flex items-center justify-center font-bold uppercase tracking-widest">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}

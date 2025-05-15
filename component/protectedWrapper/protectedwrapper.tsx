"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../provider/keycloakprovider";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authenticated) {
      // Redirect or show login fallback
      router.push("/");
    }
  }, [authenticated]);

  if (!authenticated) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}

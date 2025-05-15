"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../component/provider/keycloakprovider";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { token, authenticated } = useAuth();
  const [message, setMessage] = useState("");

  const checkKeys = async (token: string) => {
    const res = await fetch("http://localhost:5000/api/keys", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      router.push("/files");
    } else {
      router.push("/fetchkey");
    }
  };

  useEffect(() => {
    console.log(authenticated, token);
    if (!authenticated || !token) return;
    (async () => {
      await checkKeys(token);
    })();
  }, [authenticated, token]);

  return (
    <main className="p-4">
      <>loading.....</>
    </main>
  );
}

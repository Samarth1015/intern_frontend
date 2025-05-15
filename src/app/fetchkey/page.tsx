"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../component/provider/keycloakprovider";

export default function FetchKeyPage() {
  const router = useRouter();
  const { token, authenticated } = useAuth();

  const [keysMissing, setKeysMissing] = useState(false);
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKeyStatus = async () => {
      if (!authenticated || !token) return;

      try {
        const res = await fetch("http://localhost:5000/api/keys", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          router.push("/files");
        } else {
          setKeysMissing(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching key status:", err);
        setKeysMissing(true);
        setLoading(false);
      }
    };

    fetchKeyStatus();
  }, [authenticated, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessKeyId, secretAccessKey }),
      });

      if (res.ok) {
        router.push("/files");
      } else {
        console.error("Failed to submit keys");
      }
    } catch (error) {
      console.error("Error submitting keys:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Checking your access credentials...
      </div>
    );
  }

  if (keysMissing) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Set Your Access Credentials
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Access Key ID</label>
            <input
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Secret Access Key
            </label>
            <input
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </form>
      </div>
    );
  }

  return null;
}

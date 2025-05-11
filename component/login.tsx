// E:\intern\component\login.tsx
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { baseURL } from "../client/api";
import { useRouter } from "next/navigation";

export default function Component() {
  const { data: session } = useSession();
  const tokenverified = useRef(false);
  const [credentialGiven, setCredentialGiven] = useState<boolean>(false);
  const [accesskey, setAccessKey] = useState<string>("");
  const [secretaccesskey, setSecretAccessKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = window.localStorage.getItem("access_token");
      const refreshToken = window.localStorage.getItem("refresh_token");

      if (!session) {
        return;
      }

      if (accessToken && refreshToken) {
        try {
          const response = await fetch(`${baseURL}/verifyToken`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            setCredentialGiven(true);
            router.push("/files");
            return;
          }
        } catch (error) {
          console.log("s", error);
        }
      }

      try {
        const res = await fetch(`${baseURL}/isCred`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: session?.user.email }),
        });

        const data = await res.json();

        if (data.present) {
          window.localStorage.setItem("access_token", data.accessToken);
          window.localStorage.setItem("refresh_token", data.refreshToken);
          setCredentialGiven(true);
          router.push("/files");
        } else {
          setCredentialGiven(false);
        }
      } catch (error) {
        console.error("Error checking credentials:", error);
      }
    };

    checkAuth();
  }, [session, router]);

  const handleSubmit = async () => {
    if (
      tokenverified.current ||
      !session?.accessToken ||
      !secretaccesskey ||
      !accesskey
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/verifyGoogleToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleToken: session.accessToken,
          secretaccesskey,
          accesskey,
        }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken && data.refreshToken) {
        window.localStorage.setItem("access_token", data.accessToken);
        window.localStorage.setItem("refresh_token", data.refreshToken);
        tokenverified.current = true;
        setCredentialGiven(true);
        router.push("/files");
      } else {
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome back!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Signed in as {session.user.email}
            </p>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Sign out
          </button>

          {!credentialGiven && (
            <div className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label
                    htmlFor="accesskey"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Access Key
                  </label>
                  <input
                    type="text"
                    id="accesskey"
                    name="accesskey"
                    placeholder="Enter Access Key"
                    onChange={(e) => {
                      setAccessKey(e.target.value);
                    }}
                    disabled={isLoading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label
                    htmlFor="secretaccesskey"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Secret Access Key
                  </label>
                  <input
                    type="password"
                    id="secretaccesskey"
                    name="secretaccesskey"
                    placeholder="Enter Secret Access Key"
                    onChange={(e) => {
                      setSecretAccessKey(e.target.value);
                    }}
                    disabled={isLoading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Zata
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to continue
          </p>
        </div>
        <button
          onClick={async () => {
            await signIn("google");
          }}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

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

  const router = useRouter();
  useEffect(() => {
    if (window.localStorage.getItem("jwt_token") || !session) {
      console.log("false");
      return;
    }
    (async () => {
      console.log(session);
      const res = await fetch(`${baseURL}/isCred`, {
        method: "POST",
        body: JSON.stringify({ email: session?.user.email }),
      });
      const data = await res.json();
      console.log(data);
      if (data.present) {
        window.localStorage.setItem("jwt_token", data.token);
        setCredentialGiven(true);
      } else {
        setCredentialGiven(false);
      }
    })();
  }, [session]);
  const handleSubmit = async () => {
    if (
      tokenverified.current ||
      !session?.accessToken ||
      !secretaccesskey ||
      !accesskey
    ) {
      return;
    }
    try {
      const data = await fetch(`${baseURL}/verifyGoogleToken`, {
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

      const res = await data.json();

      if (data.ok && res.token) {
        window.localStorage.setItem("jwt_token", res.token);
        tokenverified.current = true;
        setCredentialGiven(true);
        router.push("/files");
      } else {
        alert("Verification failed!");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Something went wrong");
    }
  };

  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
        {credentialGiven ? (
          ""
        ) : (
          <div>
            <label htmlFor="accesskey">Access Key:</label>
            <input
              type="text"
              id="accesskey"
              name="accesskey"
              placeholder="Enter Access Key"
              onChange={(e) => {
                setAccessKey(e.target.value);
              }}
            />
            <br />
            <label htmlFor="secretaccesskey">Secret Access Key:</label>
            <input
              type="text"
              id="secretaccesskey"
              name="secretaccesskey"
              placeholder="Enter Secret Access Key"
              onChange={(e) => {
                setSecretAccessKey(e.target.value);
              }}
            />
            <button onClick={handleSubmit}>submit</button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      Not signed in <br />
      <button
        onClick={async () => {
          await signIn("google");
        }}
      >
        Sign in
      </button>
    </>
  );
}

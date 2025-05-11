// File: src/app/files/page.tsx
"use client";

import { useEffect, useState } from "react";
import { baseURL, getAuthHeader } from "../../../client/api";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FileInfo {
  key: string;
  pathStyleUrl: string;
  virtualHostUrl?: string;
}

export default function FileUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [bucketName, setBucketName] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${baseURL}/fetchfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // DO NOT SET Content-Type when using FormData
          ...getAuthHeader(),
        },
        body: JSON.stringify({ bucket: bucketName }),
      });
      const data = await res.json();
      if (res.ok) {
        setFiles(data);
      } else {
        setMessage("Failed to fetch files");
      }
    } catch (error) {
      console.log(error);
      setMessage("Error fetching files");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !bucketName.trim()) {
      setMessage("Please select a file and enter a bucket name");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucketName);

    try {
      const res = await fetch(`${baseURL}/upload`, {
        method: "POST",
        headers: {
          // DO NOT SET Content-Type when using FormData
          ...getAuthHeader(),
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("File uploaded successfully");
        fetchFiles();
      } else {
        setMessage(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Error uploading file");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => {
          window.localStorage.removeItem("jwt_token");
          signOut({ callbackUrl: "/" });
        }}
      >
        Sign out
      </button>

      <h1 className="text-2xl font-bold mb-4">Upload to Zata</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Bucket Name"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          className="border p-2 mb-2 w-full"
        />
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-2 w-full"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Upload File
        </button>
        {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
      </div>

      <h2 className="text-xl font-semibold mb-2">Files in Zata.ai Bucket</h2>
      {files.length === 0 ? (
        <div>
          <p>No files found.</p>
          <button onClick={fetchFiles}>fetchFile</button>
        </div>
      ) : (
        <ul className="list-disc pl-5">
          {files.map((file) => (
            <li key={file.key} className="mb-2">
              <p>
                <strong>{file.key}</strong>
              </p>
              <p>
                Path-Style URL:{" "}
                <a
                  href={file.pathStyleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  {file.pathStyleUrl}
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

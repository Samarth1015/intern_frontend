// File: src/app/files/page.tsx
"use client";

import { useState, useEffect } from "react";
import { baseURL, getAuthHeader } from "../../../client/api";
import { signOut } from "next-auth/react";
// import { useRouter } from "next/navigation";

interface FileInfo {
  key: string;
  pathStyleUrl: string;
  virtualHostUrl?: string;
}

interface Bucket {
  name: string;
  creationDate: string;
}

export default function FileUploader() {
  // const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      const res = await fetch(`${baseURL}/fetchbucket`, {
        method: "GET",
        headers: {
          ...getAuthHeader(),
        },
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        setBuckets(data.data);
        if (data.data.length > 0) {
          setSelectedBucket(data.data[0].name);
        }
      } else {
        setMessage("Failed to fetch buckets");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error fetching buckets");
    }
  };

  const fetchFiles = async () => {
    if (!selectedBucket) {
      setMessage("Please select a bucket first");
      return;
    }

    try {
      const res = await fetch(`${baseURL}/fetchfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ bucket: selectedBucket }),
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
    if (!file || !selectedBucket) {
      setMessage("Please select a file and a bucket");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", selectedBucket);

    try {
      const res = await fetch(`${baseURL}/upload`, {
        method: "POST",
        headers: {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
          <button
            onClick={() => {
              window.localStorage.removeItem("jwt_token");
              window.localStorage.removeItem("refresh_token");
              signOut({ callbackUrl: "/" });
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="bucket"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Bucket
              </label>
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="text-gray-500">
                  Select a bucket
                </option>
                {buckets.map((bucket) => (
                  <option
                    key={bucket.name}
                    value={bucket.name}
                    className="text-gray-900"
                  >
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">Any file up to 10MB</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpload}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Upload File
            </button>

            {message && (
              <div className="mt-4 p-4 rounded-md bg-blue-50">
                <p className="text-sm text-blue-700">{message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Files in Selected Bucket</h2>
            <button
              onClick={fetchFiles}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Refresh Files
            </button>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No files
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading a new file.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      File Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      URL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {file.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a
                          href={file.pathStyleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 break-all"
                        >
                          {file.pathStyleUrl}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

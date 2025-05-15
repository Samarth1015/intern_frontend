"use client";

import { useState, useEffect } from "react";
import { baseURL } from "../../../client/api";
import ProtectedPage from "../../../component/protectedWrapper/protectedwrapper";
import { useAuth } from "../../../component/provider/keycloakprovider";
import keycloak from "../../../keycloak/client/client";
// import { producer } from "../../../client/kafkaProducer/kafkaproducer";

interface FileInfo {
  key: string;
  pathStyleUrl: string;
}

interface Bucket {
  name: string;
  creationDate: string;
}

interface FileNode {
  name: string;
  path: string;
  isFile: boolean;
  url?: string;
  children?: FileNode[];
}

export default function FileUploader() {
  const [file, setFile] = useState<File[] | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      const res = await fetch(`${baseURL}/fetchbucket`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setBuckets(data.data);
        if (data.data.length > 0) {
          setSelectedBucket(data.data[0].name);
        }
      } else {
        setMessage("Failed to fetch buckets");
      }
    } catch {
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bucket: selectedBucket }),
      });

      const data = await res.json();
      if (res.ok) {
        const tree = buildFileTree(data);
        setTree(tree);
      } else {
        setMessage("Failed to fetch files");
      }
    } catch {
      setMessage("Error fetching files");
    }
  };

  const buildFileTree = (files: FileInfo[]): FileNode[] => {
    const root: FileNode[] = [];

    for (const file of files) {
      const parts = file.key.split("/");
      let current = root;

      parts.forEach((part, index) => {
        const existing = current.find((node) => node.name === part);
        if (existing) {
          if (!existing.children) existing.children = [];
          current = existing.children;
        } else {
          const isFile = index === parts.length - 1;
          const newNode: FileNode = {
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            isFile,
            url: isFile ? file.pathStyleUrl : undefined,
            children: isFile ? undefined : [],
          };
          current.push(newNode);
          if (!isFile) current = newNode.children!;
        }
      });
    }

    return root;
  };

  const getCurrentFolderContents = (): FileNode[] => {
    let current = tree;
    for (const pathPart of currentPath) {
      const folder = current.find((node) => node.name === pathPart);
      if (folder && folder.children) {
        current = folder.children;
      } else {
        return [];
      }
    }
    return current;
  };

  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateUp = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-2 mb-4 text-sm">
      <button
        onClick={navigateToRoot}
        className="text-blue-600 hover:text-blue-800"
      >
        Root
      </button>
      {currentPath.map((path, index) => (
        <div key={index} className="flex items-center">
          <span className="mx-2">/</span>
          <button
            onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
            className="text-blue-600 hover:text-blue-800"
          >
            {path}
          </button>
        </div>
      ))}
    </div>
  );

  const getFreshPresignedUrl = async (key: string) => {
    try {
      const res = await fetch(`${baseURL}/fetchfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bucket: selectedBucket }),
      });

      const data = await res.json();
      if (res.ok) {
        const file = data.find((f: FileInfo) => f.key === key);
        if (file) {
          return file.pathStyleUrl;
        }
      }
      setMessage("Failed to get file URL");
      return null;
    } catch {
      setMessage("Error getting file URL");
      return null;
    }
  };

  const handleFileClick = async (node: FileNode) => {
    const url = await getFreshPresignedUrl(node.path);
    if (url) {
      setPreviewFile({ url, name: node.name });
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (!extension) return "unknown";

    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const textTypes = ["txt", "md", "json", "js", "ts", "html", "css", "xml"];
    const pdfTypes = ["pdf"];
    const videoTypes = ["mp4", "webm", "ogg"];
    const audioTypes = ["mp3", "wav", "ogg"];

    if (imageTypes.includes(extension)) return "image";
    if (textTypes.includes(extension)) return "text";
    if (pdfTypes.includes(extension)) return "pdf";
    if (videoTypes.includes(extension)) return "video";
    if (audioTypes.includes(extension)) return "audio";
    return "unknown";
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;

    const fileType = getFileType(previewFile.name);

    switch (fileType) {
      case "image":
        return (
          <img
            src={previewFile.url}
            alt={previewFile.name}
            className="max-w-full max-h-[80vh] object-contain"
          />
        );
      case "pdf":
        return (
          <iframe
            src={previewFile.url}
            className="w-full h-[80vh]"
            title={previewFile.name}
          />
        );
      case "video":
        return (
          <video
            src={previewFile.url}
            controls
            className="max-w-full max-h-[80vh]"
          />
        );
      case "audio":
        return <audio src={previewFile.url} controls className="w-full" />;
      case "text":
        return (
          <iframe
            src={previewFile.url}
            className="w-full h-[80vh]"
            title={previewFile.name}
          />
        );
      default:
        return (
          <div className="text-center p-4">
            <p className="mb-4">This file type cannot be previewed.</p>
            <a
              href={previewFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open in new tab
            </a>
          </div>
        );
    }
  };

  const renderCurrentFolder = () => {
    const currentContents = getCurrentFolderContents();

    return (
      <div className="space-y-2">
        {currentPath.length > 0 && (
          <button
            onClick={navigateUp}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <span className="mr-2">←</span> Go Up
          </button>
        )}

        {currentContents.map((node) =>
          node.isFile ? (
            <div
              key={node.path}
              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => handleFileClick(node)}
            >
              <span className="mr-2">📄</span>
              <span className="text-blue-600 hover:underline break-all">
                {node.name}
              </span>
            </div>
          ) : (
            <button
              key={node.path}
              onClick={() => navigateToFolder(node.name)}
              className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left"
            >
              <span className="mr-2">📁</span>
              <span className="font-medium">{node.name}</span>
            </button>
          )
        )}
      </div>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(currentPath);

    console.log(e.target.files);
    if (e.target.files && e.target.files) {
      setFile(e.target.files ? Array.from(e.target.files) : null);
    }
  };

  // const handleUpload = async () => {
  //   if (!file || !selectedBucket) {
  //     setMessage("Please select a file and a bucket");
  //     return;
  //   }

  //   setIsUploading(true);
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("bucket", selectedBucket);

  //   const uploadPath =
  //     currentPath.length > 0
  //       ? `${currentPath.join("/")}/${file.name}`
  //       : file.name;
  //   formData.append("path", uploadPath);

  //   try {
  //     await producer.connect();

  //     // await producer.send({topic:"produce_from_frontend",messages:})
  //     // const res = await fetch(`${baseURL}/upload`, {
  //     //   method: "POST",
  //     //   headers: {
  //     //     Authorization: `Bearer ${token}`,
  //     //   },
  //     //   body: formData,
  //     // });

  //     // const data = await res.json();
  //     // if (res.ok) {
  //     //   setMessage("File uploaded successfully");
  //     //   setFile(null);
  //     //   // Reset file input
  //     //   const fileInput = document.querySelector(
  //     //     'input[type="file"]'
  //     //   ) as HTMLInputElement;
  //     //   if (fileInput) fileInput.value = "";
  //     fetchFiles();
  //     // } else {
  //     //   setMessage(data.error || "Failed to upload file");
  //     // }
  //   } catch {
  //     setMessage("Error uploading file");
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const handleUpload = async () => {
    if (!file || !selectedBucket) {
      setMessage("Please select a file and a bucket");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    file.forEach((f) => {
      formData.append("file", f);
      formData.append("fileName", f.name);
    });

    const finalPath = currentPath.join("/");
    console.log(finalPath);
    formData.append("path", finalPath);
    formData.append("bucket", selectedBucket);
    // const uploadPath =
    //   currentPath.length > 0
    //     ? `${currentPath.join("/")}/${file.name}`
    //     : file.name;

    // formData.append("path", uploadPath);

    try {
      const res = await fetch("/api/rabit-mq", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("File uploaded successfully");
        setFile(null);
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error uploading file");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        console.log("calling");
        fetchFiles();
      }, 2000);
    }
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 text-black py-10">
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">File Manager</h1>
            <button
              onClick={() =>
                keycloak.logout({ redirectUri: window.location.origin })
              }
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Upload Section */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Upload Files
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Select Bucket
                </label>
                <select
                  value={selectedBucket}
                  onChange={(e) => setSelectedBucket(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Choose a bucket --</option>
                  {buckets.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Choose File
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !file || !selectedBucket}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isUploading || !file || !selectedBucket
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {currentPath.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Uploading to: /{currentPath.join("/")}
                  </p>
                )}
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg ${
                    message.includes("success")
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* File List Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Files</h2>
              <button
                onClick={fetchFiles}
                className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="p-4">
              {renderBreadcrumbs()}

              {tree.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No files found.
                </p>
              ) : (
                <div className="bg-white rounded-lg">
                  {renderCurrentFolder()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{previewFile.name}</h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto">{renderPreviewContent()}</div>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}

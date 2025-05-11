// E:\intern\client\api.ts
export const baseURL = "http://localhost:5000/api";

export const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return {
    Authorization: `Bearer ${token}`,
    "x-refresh-token": refreshToken || "",
  };
};

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${baseURL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    ...options.headers,
    ...getAuthHeader(),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token expired, try to refresh
      const newToken = await refreshToken();

      // Update headers with new token
      const updatedHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
        "x-refresh-token": localStorage.getItem("refresh_token") || "",
      };

      // Retry the request with new token
      return fetch(url, { ...options, headers: updatedHeaders });
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

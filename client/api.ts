// E:\intern\client\api.ts
export const baseURL = "http://localhost:5000/api";

export const getAuthHeader = () => {
  const token = localStorage.getItem("jwt_token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

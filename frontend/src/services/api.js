import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const testBackend = async () => {
  const response = await api.get("/");
  return response.data;
};

export default api;
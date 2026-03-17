import axios from "axios";
import { auth } from "./firebase";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatApi = {
  send: (
    message: string,
    chatId?: string,
    history?: Array<{ role: string; content: string }>
  ) =>
    apiClient.post("/chat", {
      message,
      chat_id: chatId,
      history: history || [],
    }),
};

export const stockApi = {
  list: () => apiClient.get("/stocks"),
  get: (symbol: string) => apiClient.get(`/stocks/${symbol}`),
};

export const alertApi = {
  list: () => apiClient.get("/alerts"),
  create: (data: {
    symbol: string;
    condition: "above" | "below";
    price: number;
  }) => apiClient.post("/alerts", data),
  delete: (id: string) => apiClient.delete(`/alerts/${id}`),
};

export default apiClient;

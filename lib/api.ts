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
  listHistory: () => apiClient.get("/chat/history"),
  getMessages: (chatId: string) => apiClient.get(`/chat/history/${chatId}`),
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

export const syncApi = {
  createJob: (params?: { full_market?: boolean }) =>
    apiClient.post("/sync/jobs", null, { params }),
  getJob: (jobId: string) => apiClient.get(`/sync/jobs/${jobId}`),
};

export default apiClient;

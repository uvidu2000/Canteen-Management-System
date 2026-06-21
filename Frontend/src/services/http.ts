import axios, { AxiosError } from "axios";
import { API_ENDPOINTS } from "@/constants/api";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage";
import { getStorageItem, removeStorageItem } from "@/utils/storage";

const API_BASE_URL = "http://localhost:5000";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

http.interceptors.request.use((config) => {
  const token = getStorageItem(STORAGE_KEYS.accessToken);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeStorageItem(STORAGE_KEYS.accessToken);

      if (window.location.pathname !== ROUTES.login) {
        window.location.assign(ROUTES.login);
      }
    }

    return Promise.reject(error);
  }
);

export { API_BASE_URL, API_ENDPOINTS };

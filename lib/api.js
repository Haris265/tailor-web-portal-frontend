import axios from "axios";
import { clearToken, getToken, setToken } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isLoginRequest = error.config?.url?.includes("auth/login");
      if (!isLoginRequest) {
        clearToken();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function login(username, password) {
  const { data } = await api.post("auth/login/", { username, password });
  setToken(data.token);
  return data;
}

export async function logout() {
  try {
    await api.post("auth/logout/");
  } catch {
    // Clear local session even if the server call fails
  } finally {
    clearToken();
  }
}

export function getMe() {
  return api.get("auth/me/");
}

export function getDashboardStats(params = {}) {
  return api.get("dashboard/stats/", { params });
}

export function searchCustomers(query) {
  return api.get("customers/", { params: { search: query } });
}

export function listCustomers(params = {}) {
  return api.get("customers/", { params });
}

export function getCustomer(id) {
  return api.get(`customers/${id}/`);
}

export function createCustomer(data) {
  return api.post("customers/", data);
}

export function updateCustomer(id, data) {
  return api.patch(`customers/${id}/`, data);
}

export function deleteCustomer(id) {
  return api.delete(`customers/${id}/`);
}

export function listMeasurements(params = {}) {
  return api.get("measurements/", { params });
}

export function createMeasurement(data) {
  return api.post("measurements/", data);
}

export function updateMeasurement(id, data) {
  return api.patch(`measurements/${id}/`, data);
}

export function deleteMeasurement(id) {
  return api.delete(`measurements/${id}/`);
}

export function listOrders(params = {}) {
  return api.get("orders/", { params });
}

export function getOrder(id) {
  return api.get(`orders/${id}/`);
}

export function createOrder(data) {
  return api.post("orders/", data);
}

export function updateOrder(id, data) {
  return api.patch(`orders/${id}/`, data);
}

export function listCatalogItems(params = {}) {
  return api.get("catalog-items/", { params });
}

export function createCatalogItem(data) {
  return api.post("catalog-items/", data);
}

export function updateCatalogItem(id, data) {
  return api.patch(`catalog-items/${id}/`, data);
}

export function deleteCatalogItem(id) {
  return api.delete(`catalog-items/${id}/`);
}

export default api;

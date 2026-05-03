import { apiPost } from "./api";

export const registerUser = (payload) => apiPost("/auth/register", payload);

export const loginUser = (payload) => apiPost("/auth/login", payload);

import { apiGet } from "./api";

export const getDashboard = (token) => apiGet("/insights/dashboard", token);

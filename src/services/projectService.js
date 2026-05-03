import { apiGet, apiPost } from "./api";

export const getProjects = (token) => apiGet("/projects", token);

export const createProject = (payload, token) =>
  apiPost("/projects", payload, token);

export const getProject = (projectId, token) => apiGet(`/projects/${projectId}`, token);

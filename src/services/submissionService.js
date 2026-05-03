import { apiGet, apiPost, apiPut } from "./api";

export const getSubmissions = (token) => apiGet("/submissions/user", token);

export const getAdminSubmissions = (token) => apiGet("/submissions/admin", token);

export const createSubmission = (payload, token) =>
  apiPost("/submissions", payload, token);

export const reviewSubmission = (submissionId, payload, token) =>
  apiPut(`/submissions/review/${submissionId}`, payload, token);

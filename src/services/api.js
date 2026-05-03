const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const buildHeaders = (token, hasJsonBody = true) => {
  const headers = {};

  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (payload && payload.message) ||
      (typeof payload === "string" ? payload : "Request failed");

    throw new Error(message);
  }

  return payload;
};

const request = async ({ path, method = "GET", body, token }) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
};

export const apiGet = (path, token) => request({ path, method: "GET", token });
export const apiPost = (path, body, token) =>
  request({ path, method: "POST", body, token });
export const apiPut = (path, body, token) =>
  request({ path, method: "PUT", body, token });
export const apiDelete = (path, token) =>
  request({ path, method: "DELETE", token });

import { apiGet } from "./api";

export const getPublicProfile = (username, includeAll = false) =>
  apiGet(`/public/${encodeURIComponent(username)}${includeAll ? "?all=true" : ""}`);

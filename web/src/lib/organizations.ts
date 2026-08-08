import { apiFetch } from "./api";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isFollowed: boolean;
}

export function fetchOrganizations() {
  return apiFetch<Organization[]>("/organizations");
}

export function followOrganization(id: string) {
  return apiFetch<void>(`/organizations/${id}/follow`, { method: "POST" });
}

export function unfollowOrganization(id: string) {
  return apiFetch<void>(`/organizations/${id}/follow`, { method: "DELETE" });
}

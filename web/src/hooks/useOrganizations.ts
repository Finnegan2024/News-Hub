import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrganizations,
  followOrganization,
  unfollowOrganization,
} from "../lib/organizations";

const ORGANIZATIONS_QUERY_KEY = ["organizations"];

export function useOrganizations() {
  return useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: fetchOrganizations,
  });
}

export function useFollowOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: followOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY }),
  });
}

export function useUnfollowOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unfollowOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../lib/api";
import { fetchMe, login, logout, register } from "../lib/auth";

const ME_QUERY_KEY = ["me"];

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    retry: false,
    // A 401 here just means "not logged in" — not a fetch failure to retry.
    throwOnError: (error) => !(error instanceof ApiError && error.status === 401),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register(email, password),
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(ME_QUERY_KEY, null),
  });
}

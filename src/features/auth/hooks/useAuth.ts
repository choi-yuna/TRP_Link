"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginApi, logoutApi, meApi } from "../services/auth.service";

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { username: string; password: string }) => loginApi(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      window.location.href = "/dashboard";
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await logoutApi();
    qc.clear();
    window.location.href = "/login";
  };
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: meApi,
    retry: 0,
    staleTime: 60_000,
  });
}
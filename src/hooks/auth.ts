import { useMutation } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';
import type { User } from '@/contexts/AuthContext';

interface AuthResponse {
  user: User;
  token: string;
}

export function useLogin() {
  return useMutation<AuthResponse, ApiError, { email: string; password: string }>({
    mutationFn: (data) => apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: data }),
  });
}

export function useRegister() {
  return useMutation<
    AuthResponse,
    ApiError,
    { name: string; email: string; password: string; password_confirmation: string }
  >({
    mutationFn: (data) => apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: data }),
  });
}

export function useRequestMagicLink() {
  return useMutation<{ message: string }, ApiError, { email: string }>({
    mutationFn: (data) =>
      apiFetch<{ message: string }>('/auth/magic-link', { method: 'POST', body: data }),
  });
}

export function useAuthenticateMagicLink() {
  return useMutation<AuthResponse, ApiError, { token: string }>({
    mutationFn: (data) =>
      apiFetch<AuthResponse>('/auth/magic-link/authenticate', { method: 'POST', body: data }),
  });
}

export function useForgotPassword() {
  return useMutation<{ message: string }, ApiError, { email: string }>({
    mutationFn: (data) =>
      apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: data }),
  });
}

export function useResetPassword() {
  return useMutation<
    { message: string },
    ApiError,
    { token: string; email: string; password: string; password_confirmation: string }
  >({
    mutationFn: (data) =>
      apiFetch<{ message: string }>('/auth/reset-password', { method: 'POST', body: data }),
  });
}

export function useVerifyEmail() {
  return useMutation<{ message: string }, ApiError, { token: string }>({
    mutationFn: (data) =>
      apiFetch<{ message: string }>('/auth/email/verify', { method: 'POST', body: data }),
  });
}

export function useLogout() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
  });
}

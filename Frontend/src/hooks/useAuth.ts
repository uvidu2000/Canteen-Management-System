import { useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/constants/storage";
import type { UserRole } from "@/types/auth";
import { getStorageItem, removeStorageItem, setStorageItem } from "@/utils/storage";

type AuthPortal = "student" | "staff";

type AuthUser = {
  portal: AuthPortal | null;
  name: string | null;
  identifier: string | null;
  role: UserRole | null;
};

function decodeTokenUser(token: string | null): AuthUser {
  if (!token) {
    return { portal: null, name: null, identifier: null, role: null };
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return { portal: null, name: null, identifier: null, role: null };
    }

    const decodedPayload = JSON.parse(
      window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { identifier?: unknown; name?: unknown; portal?: unknown; role?: unknown };
    const portal =
      decodedPayload.portal === "student" || decodedPayload.portal === "staff"
        ? decodedPayload.portal
        : null;
    const role =
      decodedPayload.role === "student" ||
      decodedPayload.role === "lecturer" ||
      decodedPayload.role === "canteen_staff" ||
      decodedPayload.role === "admin"
        ? decodedPayload.role
        : null;

    return {
      portal,
      role,
      name: typeof decodedPayload.name === "string" ? decodedPayload.name : null,
      identifier:
        typeof decodedPayload.identifier === "string" ? decodedPayload.identifier : null
    };
  } catch {
    return { portal: null, name: null, identifier: null, role: null };
  }
}

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() =>
    getStorageItem(STORAGE_KEYS.accessToken)
  );
  const user = useMemo(() => decodeTokenUser(token), [token]);

  const setToken = useCallback((nextToken: string) => {
    setStorageItem(STORAGE_KEYS.accessToken, nextToken);
    setTokenState(nextToken);
  }, []);

  const clearToken = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.accessToken);
    setTokenState(null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
  }, [clearToken]);

  return useMemo(
    () => ({
      token,
      portal: user.portal,
      role: user.role,
      user,
      isAuthenticated: Boolean(token),
      setToken,
      clearToken,
      logout
    }),
    [clearToken, logout, setToken, token, user]
  );
}

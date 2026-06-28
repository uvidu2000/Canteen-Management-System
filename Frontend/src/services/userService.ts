import { API_ENDPOINTS } from "@/constants/api";
import { http } from "@/services/http";
import type { ManagedUser, UpdateUserPayload, UserFormValues } from "@/types/user";

type UserListResponse = {
  items: ManagedUser[];
};

export const userService = {
  async list(): Promise<ManagedUser[]> {
    const response = await http.get<UserListResponse>(API_ENDPOINTS.users.base);
    return response.data.items;
  },

  async create(payload: UserFormValues): Promise<ManagedUser> {
    const response = await http.post<ManagedUser>(API_ENDPOINTS.users.base, payload);
    return response.data;
  },

  async update(userId: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    const response = await http.patch<ManagedUser>(API_ENDPOINTS.users.byId(userId), payload);
    return response.data;
  },

  async remove(userId: string): Promise<void> {
    await http.delete(API_ENDPOINTS.users.byId(userId));
  }
};

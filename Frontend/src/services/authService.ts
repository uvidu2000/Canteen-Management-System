import { API_ENDPOINTS } from "@/constants/api";
import { http } from "@/services/http";
import type { LoginRequest, LoginResponse, OtpVerificationRequest } from "@/types/auth";

export const authService = {
  async requestOtp(payload: LoginRequest): Promise<void> {
    await http.post(API_ENDPOINTS.auth.login, payload);
  },

  async verifyOtp(payload: OtpVerificationRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>(API_ENDPOINTS.auth.verifyOtp, payload);
    return response.data;
  }
};

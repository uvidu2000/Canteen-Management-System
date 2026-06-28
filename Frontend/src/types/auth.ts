export type LoginRequest = {
  identifier: string;
  portal: "student" | "staff";
};

export type UserRole = "student" | "lecturer" | "canteen_staff" | "admin";

export type OtpVerificationRequest = LoginRequest & {
  otp: string;
};

export type LoginResponse = {
  accessToken: string;
  portal: LoginRequest["portal"];
  role: UserRole;
};

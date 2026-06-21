export type LoginRequest = {
  identifier: string;
  portal: "student" | "staff";
};

export type OtpVerificationRequest = LoginRequest & {
  otp: string;
};

export type LoginResponse = {
  accessToken: string;
};

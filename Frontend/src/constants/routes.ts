export const ROUTES = {
  root: "/",
  login: "/login",
  otp: "/otp",
  home: "/home",
  staffOrders: "/staff/orders",
  studentOrders: "/student/orders",
  studentVotes: "/student/votes",
  notFound: "*"
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Hash, HelpCircle, Phone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import type { LoginRequest } from "@/types/auth";
import { cn } from "@/utils/cn";

type PortalType = LoginRequest["portal"];

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Identifier is required."),
  portal: z.enum(["student", "staff"])
}).superRefine((values, context) => {
  const normalizedIdentifier = values.identifier.replace(/\D/g, "");

  if (values.portal === "student" && !/^\d{8}$/.test(normalizedIdentifier)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid 8 digit student ID.",
      path: ["identifier"]
    });
  }

  if (
    values.portal === "staff" &&
    !/^(\+94|0)?7\d[\s-]?\d{3}[\s-]?\d{4}$/.test(values.identifier)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid mobile number.",
      path: ["identifier"]
    });
  }
});

export function LoginPage() {
  const navigate = useNavigate();
  const [selectedPortal, setSelectedPortal] = useState<PortalType>("student");

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      portal: selectedPortal
    }
  });

  const loginMutation = useMutation({
    mutationFn: authService.requestOtp,
    onSuccess: (_, values) => {
      navigate(ROUTES.otp, {
        replace: true,
        state: {
          identifier: values.identifier,
          portal: values.portal
        }
      });
    }
  });

  function handlePortalChange(portal: PortalType) {
    setSelectedPortal(portal);
    setValue("portal", portal, { shouldValidate: true });
    setValue("identifier", "", { shouldValidate: false });
  }

  function onSubmit(values: LoginRequest) {
    loginMutation.mutate({ ...values, portal: selectedPortal });
  }

  const errorMessage =
    loginMutation.error instanceof AxiosError
      ? loginMutation.error.response?.data?.message ?? "Unable to send OTP. Please try again."
      : "Unable to send OTP. Please try again.";

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
        <Button type="button" variant="ghost" size="icon" aria-label="Help" title="Help">
          <HelpCircle className="h-5 w-5 text-primary" />
        </Button>
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-6 w-full max-w-xl text-center sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Department Portal
          </p>
          {/* <h1 className="mt-3 text-balance text-lg font-semibold leading-tight text-foreground sm:text-xl">
            Smart Campus Dining
          </h1> */}
        </section>

        <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardHeader className="space-y-3 px-6 pt-8 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Access Portal</p>
            <CardTitle className="text-2xl font-bold text-foreground sm:text-3xl">
              Smart Campus Dining
            </CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-8 sm:px-8">
            <div className="mb-7 grid grid-cols-2 rounded-md bg-muted p-1">
              {(["student", "staff"] as const).map((portal) => (
                <Button
                  key={portal}
                  type="button"
                  variant={selectedPortal === portal ? "secondary" : "ghost"}
                  className={cn(
                    "h-10 rounded-sm text-xs font-semibold sm:text-sm",
                    selectedPortal === portal && "bg-card shadow-sm"
                  )}
                  onClick={() => handlePortalChange(portal)}
                >
                  {portal === "student" ? "Student Portal" : "Staff Portal"}
                </Button>
              ))}
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" value={selectedPortal} {...register("portal")} />

              <div>
                <h2 className="text-xl font-semibold tracking-normal text-foreground">Sign In</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selectedPortal === "student"
                    ? "Enter your student ID to receive a secure one-time password (OTP)."
                    : "Enter your registered mobile number to receive a secure one-time password (OTP)."}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="identifier"
                  className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {selectedPortal === "student" ? "Student ID" : "Mobile Number"}
                </Label>
                <div className="relative">
                  {selectedPortal === "student" ? (
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  ) : (
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    inputMode={selectedPortal === "student" ? "numeric" : "tel"}
                    autoComplete="off"
                    placeholder={selectedPortal === "student" ? "20211188" : "+94 7X XXX XXXX"}
                    className="h-12 pl-10"
                    {...register("identifier")}
                  />
                </div>
                {errors.identifier?.message ? (
                  <p className="text-sm text-destructive">{errors.identifier.message}</p>
                ) : null}
              </div>

              {loginMutation.isError ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
              ) : null}

              <Button type="submit" className="h-12 w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Sending OTP" : "Send OTP"}
              </Button>
            </form>

            <div className="mt-10 flex gap-3 text-xs leading-5 text-muted-foreground">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>For access issues or forgotten credentials, please contact your system administrator.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

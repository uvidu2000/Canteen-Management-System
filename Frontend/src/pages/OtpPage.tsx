import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import type { LoginRequest } from "@/types/auth";
import { cn } from "@/utils/cn";

type OtpRouteState = LoginRequest;

const OTP_LENGTH = 6;

function formatIdentifier(identifier: string): string {
  return identifier.replace(/\D/g, "");
}

export function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const routeState = location.state as OtpRouteState | null;
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verifyOtpMutation = useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: ({ accessToken }) => {
      setToken(accessToken);
      navigate(ROUTES.home, { replace: true });
    }
  });

  if (!routeState?.identifier || !routeState.portal) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const otpContext = routeState;

  function handleDigitChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = nextValue;
    setOtpDigits(nextDigits);

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    if (!pastedDigits.length) {
      return;
    }

    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pastedDigits[index] ?? "");
    setOtpDigits(nextDigits);
    inputRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus();
  }

  function handleSubmit() {
    const otp = otpDigits.join("");

    if (otp.length !== OTP_LENGTH) {
      verifyOtpMutation.reset();
      return;
    }

    verifyOtpMutation.mutate({
      identifier: otpContext.identifier,
      portal: otpContext.portal,
      otp
    });
  }

  const isOtpIncomplete = otpDigits.join("").length !== OTP_LENGTH;
  const showValidationError = verifyOtpMutation.isIdle && otpDigits.some(Boolean) && isOtpIncomplete;

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
                  variant={otpContext.portal === portal ? "secondary" : "ghost"}
                  className={cn(
                    "h-10 rounded-sm text-xs font-semibold sm:text-sm",
                    otpContext.portal === portal && "bg-card shadow-sm"
                  )}
                  disabled
                >
                  {portal === "student" ? "Student Portal" : "Staff Portal"}
                </Button>
              ))}
            </div>

            <div className="space-y-5">
              <div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-left text-xl font-semibold tracking-normal text-foreground"
                  onClick={() => navigate(ROUTES.login)}
                  aria-label="Back to sign in"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  Enter OTP
                </button>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Enter the one-time password sent to your registered identifier.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  OTP sent to {otpContext.portal === "student" ? "university email" : "mobile number"}{" "}
                  { otpContext.portal === "student" ? "" : formatIdentifier(otpContext.identifier)}
                </p>
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleDigitChange(index, event)}
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      onPaste={handlePaste}
                      className="h-12 min-w-0 rounded-md border border-input bg-background text-center text-lg font-semibold text-foreground shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-14"
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
                {showValidationError ? (
                  <p className="text-sm text-destructive">Enter the 6 digit OTP.</p>
                ) : null}
                {verifyOtpMutation.isError ? (
                  <p className="text-sm text-destructive">Invalid OTP. Please try again.</p>
                ) : null}
              </div>

              <Button
                type="button"
                className="h-12 w-full"
                disabled={verifyOtpMutation.isPending}
                onClick={handleSubmit}
              >
                {verifyOtpMutation.isPending ? "Verifying OTP" : "Verify OTP"}
              </Button>
            </div>

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

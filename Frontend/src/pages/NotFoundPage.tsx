import { Link } from "react-router-dom";
import { HeaderBar } from "@/components/HeaderBar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderBar title="React App" />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-normal">Page not found</h2>
        <p className="mt-3 text-sm text-muted-foreground">The page you are looking for does not exist.</p>
        <Button asChild className="mt-6">
          <Link to={ROUTES.home}>Go home</Link>
        </Button>
      </main>
    </div>
  );
}

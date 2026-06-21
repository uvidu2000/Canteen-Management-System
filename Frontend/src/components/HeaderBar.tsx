import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type HeaderBarProps = {
  title: string;
  actions?: ReactNode;
};

export function HeaderBar({ title, actions }: HeaderBarProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <h1 className="text-lg font-semibold tracking-normal">{title}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}

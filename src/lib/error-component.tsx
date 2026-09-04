import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-8" strokeWidth={1.75} />
      </span>
      <h1 className="title-3">出了点问题</h1>
      <p className="max-w-md text-subhead leading-relaxed break-words text-muted">
        {error.message || "发生了意外错误，请再试一次。"}
      </p>
    </main>
  );
}

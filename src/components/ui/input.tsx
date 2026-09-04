import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl bg-fill px-4 text-body text-fg outline-none placeholder:text-subtle",
        "transition-[box-shadow,background-color] duration-150",
        "focus:bg-surface focus:shadow-[0_0_0_4px_rgb(0_113_227_/_0.18)]",
        className,
      )}
      {...props}
    />
  );
}

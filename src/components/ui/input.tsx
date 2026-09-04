import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl bg-fill px-4 text-base text-fg outline-none placeholder:text-subtle",
        "transition-[box-shadow,background-color] duration-150 ease-smooth-out",
        "focus:bg-surface focus:shadow-[0_0_0_4px_rgba(0,113,227,0.18)]",
        className,
      )}
      {...props}
    />
  );
}

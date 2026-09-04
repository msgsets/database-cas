import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-xl bg-fill px-5 py-4 text-base leading-relaxed text-fg outline-none placeholder:text-subtle",
        "transition-[box-shadow,background-color] duration-150 ease-smooth-out",
        "focus:bg-surface focus:shadow-[0_0_0_4px_rgba(0,113,227,0.18)]",
        className,
      )}
      {...props}
    />
  );
}

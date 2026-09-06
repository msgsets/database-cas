import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none bg-transparent text-body leading-relaxed text-fg outline-none placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}

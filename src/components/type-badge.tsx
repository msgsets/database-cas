import {
  FileText,
  Image as ImageIcon,
  Link2,
  Newspaper,
  Play,
  type LucideIcon,
} from "lucide-react";
import { CLIP_TYPE_LABEL, type ClipType } from "@/lib/clip-types";
import { cn } from "@/lib/utils";

const ICONS: Record<ClipType, LucideIcon> = {
  link: Link2,
  article: Newspaper,
  video: Play,
  image: ImageIcon,
  text: FileText,
};

export function TypeIcon({
  type,
  className,
}: {
  type: ClipType;
  className?: string;
}) {
  const Icon = ICONS[type];
  return (
    <Icon
      className={cn("size-4", type === "video" && "ml-px", className)}
      strokeWidth={1.75}
    />
  );
}

export function TypeBadge({
  type,
  className,
}: {
  type: ClipType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-fill px-2.5 py-1 text-caption font-medium tracking-wide text-muted",
        className,
      )}
    >
      <TypeIcon type={type} className="size-3.5" />
      {CLIP_TYPE_LABEL[type]}
    </span>
  );
}

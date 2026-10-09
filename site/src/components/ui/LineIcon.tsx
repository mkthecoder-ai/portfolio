import { LINE_ICONS, type LineIconName } from "@/lib/line-icons";

export function LineIcon({ name, size = 16, className }: { name: LineIconName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}
      dangerouslySetInnerHTML={{ __html: LINE_ICONS[name] }} />
  );
}

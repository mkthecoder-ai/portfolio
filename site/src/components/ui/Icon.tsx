import type { IconRef } from "@/lib/types";
import { Logo } from "./Logo";
import { LineIcon } from "./LineIcon";

export type { IconRef };

/** A stack icon in a `size` slot. Solid brand logos are drawn at 7/8 of the slot so they match the outline icons' weight. */
export function Icon({ icon, size = 16 }: { icon: IconRef; size?: number }) {
  const brand = Math.round(size * 0.875);
  return "brand" in icon
    ? <span className="icon-box" style={{ width: brand, height: brand }}><Logo slug={icon.brand} /></span>
    : <LineIcon name={icon.line} size={size} />;
}

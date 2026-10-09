import type { CSSProperties } from "react";

/** Typed helper for CSS custom properties in style props, e.g. style={vars({ "--i": 2 })}. */
export const vars = (values: Record<`--${string}`, string | number>) => values as CSSProperties;

import type { CSSProperties } from "react";

// Areas and ships drive their accent colour through CSS custom properties.
// These helpers centralise the (otherwise repeated) cast.
export function areaColorStyle(color: string): CSSProperties {
  return { "--area-color": color } as CSSProperties;
}

export function shipColorStyle(color: string): CSSProperties {
  return { "--ship-color": color } as CSSProperties;
}

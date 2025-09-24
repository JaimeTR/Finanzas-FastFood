import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 60"
      width="120"
      height="36"
      aria-label="FastFood Finances Logo"
      {...props}
    >
      <rect width="200" height="60" fill="transparent" />
      <text
        x="10"
        y="42"
        fontFamily="Inter, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
      >
        <tspan fill="hsl(var(--accent))">FF</tspan>
        <tspan>Finances</tspan>
      </text>
    </svg>
  );
}

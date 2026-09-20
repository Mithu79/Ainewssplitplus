import type { ReactNode, SVGProps } from "react";

const P: Record<string, ReactNode> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  chip: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
      <path d="M9.5 2.5v4M14.5 2.5v4M9.5 17.5v4M14.5 17.5v4M2.5 9.5h4M2.5 14.5h4M17.5 9.5h4M17.5 14.5h4" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5.5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 0 0 8 10M16 5.5h2.5A2.5 2.5 0 0 1 16 10M12 13.5V17M8.5 20.5h7l-1-3.5h-5l-1 3.5Z" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v6.4L5.9 17.6A2 2 0 0 0 7.6 20.6h8.8a2 2 0 0 0 1.7-3L13.5 9.4V3" />
      <path d="M7.8 15h8.4" />
    </>
  ),
  heart: <path d="M12 20.4S4.6 15.9 4.6 10.7A3.9 3.9 0 0 1 12 8.3a3.9 3.9 0 0 1 7.4 2.4c0 5.2-7.4 9.7-7.4 9.7Z" />,
  film: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M7.5 4.5v15M16.5 4.5v15M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.8-5.6 6.8-10.6A6.8 6.8 0 1 0 5.2 10.4C5.2 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.2" r="2.4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z" />,
  refresh: <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1M20.8 3.6v5.2h-5.2" />,
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  arrowLeft: <path d="M19.5 12h-15M10.5 18l-6-6 6-6" />,
  arrowUp: <path d="M12 19.5v-15M6 10.5l6-6 6 6" />,
  arrowDown: <path d="M12 4.5v15M6 13.5l6 6 6-6" />,
  external: <path d="M14 4h6v6M20 4l-8.5 8.5M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  layers: <path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8ZM3.4 12.6 12 17.2l8.6-4.6M3.4 16.8 12 21.4l8.6-4.6" />,
  alert: <path d="M12 3.4 21.6 20H2.4L12 3.4ZM12 9.6v4.6M12 17.2h.01" />,
  rss: (
    <>
      <path d="M4.5 11a8.5 8.5 0 0 1 8.5 8.5M4.5 4.5A15 15 0 0 1 19.5 19.5" />
      <circle cx="5.4" cy="18.6" r="1.6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronRight: <path d="m9.5 6 5.5 6-5.5 6" />,
  check: <path d="m5 12.8 4.4 4.4L19 7.4" />,
  flame: <path d="M12 3.2s4.9 4.2 4.9 8.6a4.9 4.9 0 0 1-9.8 0c0-1.9 1-3.4 2-4.4 0 1.5.8 2.4 1.7 2.4 1.2 0 1.9-1.4 1.2-6.6Z" />,
  bolt: <path d="M13.4 2.5 4.8 14h6.3l-1 7.5 8.6-11.6h-6.3l1-7.4Z" />,
  users: (
    <>
      <circle cx="9.2" cy="8" r="3.3" />
      <path d="M3.2 20a6 6 0 0 1 12 0M16.2 5.4a3.2 3.2 0 0 1 0 5.6M17.4 20h3.4a5 5 0 0 0-3-4.6" />
    </>
  ),
  activity: <path d="M3 12.5h4L10 20l4.2-15.5 2.6 8H21" />,
  filter: <path d="M3.5 5.5h17l-6.6 7.7V19l-3.8-2v-3.8L3.5 5.5Z" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  list: <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M3.6 6.5h.01M3.6 12h.01M3.6 17.5h.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 11.2v5M12 8.1h.01" />
    </>
  ),
  code: <path d="m9.2 7.8-4.4 4.4 4.4 4.4M14.8 7.8l4.4 4.4-4.4 4.4" />,
  sparkles: (
    <>
      <path d="m11.4 3.2 1.7 4.5 4.5 1.7-4.5 1.7-1.7 4.5-1.7-4.5L5.2 9.4l4.5-1.7 1.7-4.5Z" />
      <path d="m18.2 15.1.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" />
    </>
  ),
  newspaper: (
    <>
      <path d="M4 5.2h13v14.2H5.2a1.2 1.2 0 0 1-1.2-1.2V5.2Z" />
      <path d="M17 8.4h2.8v9.4a1.8 1.8 0 0 1-1.8 1.8h-1M7.2 8.6h6.6M7.2 11.8h6.6M7.2 15h3.6" />
    </>
  ),
  bookmark: <path d="M6.5 4h11v16.4L12 16.6l-5.5 3.8V4Z" />,
  link: <path d="M10.4 13.4a4.6 4.6 0 0 0 6.6 0l2-2a4.6 4.6 0 0 0-6.6-6.6l-1 1M13.6 10.6a4.6 4.6 0 0 0-6.6 0l-2 2a4.6 4.6 0 0 0 6.6 6.6l1-1" />,
  trending: <path d="M3.5 17.5 9.8 11l3.7 3.7 7-7M15 7.5h5.5V13" />,
  calendar: (
    <>
      <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2" />
      <path d="M8.2 3.2v4M15.8 3.2v4M3.4 10.6h17.2" />
    </>
  ),
  shield: <path d="M12 3.2 20 6v6.2c0 4.6-3.4 7.6-8 8.6-4.6-1-8-4-8-8.6V6l8-2.8Z" />,
  inbox: <path d="M3.4 13.4h4.8l1.6 2.8h4.4l1.6-2.8h4.8M5.4 5h13.2l2 8.4v5.2a1.4 1.4 0 0 1-1.4 1.4H4.8a1.4 1.4 0 0 1-1.4-1.4v-5.2L5.4 5Z" />,
  sliders: (
    <>
      <path d="M4 8.4h9M17.6 8.4H20M4 15.6h3.6M12.4 15.6H20" />
      <circle cx="15.2" cy="8.4" r="2.2" />
      <circle cx="9.8" cy="15.6" r="2.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  eye: (
    <>
      <path d="M2.6 12S6 5.9 12 5.9 21.4 12 21.4 12 18 18.1 12 18.1 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export type IconName = keyof typeof P;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = "h-4 w-4", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}

export const CATEGORY_ICON: Record<string, IconName> = {
  globe: "globe",
  chip: "chip",
  briefcase: "briefcase",
  trophy: "trophy",
  flask: "flask",
  heart: "heart",
  film: "film",
  pin: "pin",
};

/** The NewsSplit mark: a folded broadsheet split into two live panels. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="1.5" y="4" width="29" height="24" rx="5" fill="var(--ink)" />
      <path d="M6 22.5 12.8 9.5v13" stroke="var(--bg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M19 9.5h7.2M19 15.2h5.4M19 20.9h7.2" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

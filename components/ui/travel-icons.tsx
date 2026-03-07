import * as React from "react";

export type TravelIconName =
  | "palm"
  | "luggage"
  | "plane"
  | "shield"
  | "wallet"
  | "map"
  | "spark"
  | "clock"
  | "users"
  | "document"
  | "message"
  | "bell"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "whatsapp"
  | "x"
  | "linkedin"
  | "web";

interface TravelIconProps {
  name: TravelIconName;
  className?: string;
  title?: string;
}

function SvgFrame({
  children,
  className,
  title
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function TravelIcon({ name, className, title }: TravelIconProps) {
  switch (name) {
    case "palm":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M5 22c3.5-1.3 10.5-1.3 14 0" />
          <path d="M12 21v-5.2c0-3.1-1-6.2-3.1-8.5" />
          <path d="M13 21v-3.8c0-2.2.8-4.2 2.5-5.9" />
          <path d="M8.6 7.5c1.4.2 2.7.9 3.7 2" />
          <path d="M7.3 8.8c1.2-.3 2.6-.2 3.8.3" />
          <path d="M9.3 6.2c1.1.5 2 1.3 2.7 2.3" />
          <path d="M14.9 11.7c1 .1 1.9.6 2.7 1.3" />
          <path d="M14.1 13c.8-.3 1.8-.3 2.6 0" />
          <path d="M15.5 10.4c.8.3 1.5.9 2 1.6" />
        </SvgFrame>
      );
    case "luggage":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="4" y="7" width="8" height="12" rx="2" />
          <rect x="13" y="9" width="7" height="10" rx="2" />
          <path d="M6.5 7V4.8h3V7" />
          <path d="M15 9V6.8h2.8V9" />
          <path d="M8 19v2M16 19v2M18 19v2" />
        </SvgFrame>
      );
    case "plane":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M2.4 12.5L21.3 6.4c.6-.2.9.6.4.9l-6.5 3.2v4.3l2.3 1.4c.4.3.1.9-.4.8l-3.5-.8-2.1 1-.7 2.8c-.1.4-.7.4-.8 0l-.8-2.3-5.2-1.2c-.6-.1-.6-.9 0-1l5.8-1.2 1.7-1.7-5.8-.8c-.5-.1-.5-.8 0-1Z" />
        </SvgFrame>
      );
    case "shield":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M12 3l7 2.8v5.8c0 4.2-2.8 7.5-7 9.4-4.2-1.9-7-5.2-7-9.4V5.8L12 3Z" />
          <path d="M9 12.2l1.8 1.9 4.2-4.5" />
        </SvgFrame>
      );
    case "wallet":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 9h18" />
          <circle cx="16.8" cy="13.5" r="1" />
        </SvgFrame>
      );
    case "map":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M3 6.5l5-2 5 2 8-3v14l-8 3-5-2-5 2v-14Z" />
          <path d="M8 4.5v14M13 6.5v14" />
        </SvgFrame>
      );
    case "clock":
      return (
        <SvgFrame className={className} title={title}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.8v4.7l3.2 1.8" />
        </SvgFrame>
      );
    case "users":
      return (
        <SvgFrame className={className} title={title}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="16.7" cy="9.8" r="2.3" />
          <path d="M3.8 19c.5-3 2.8-4.7 5.3-4.7s4.8 1.7 5.3 4.7" />
          <path d="M14.3 18.7c.4-1.9 1.8-3.3 3.7-3.5 1.4-.1 2.2.3 3 1.1" />
        </SvgFrame>
      );
    case "document":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4M10 11h5M10 14h5M10 17h3" />
        </SvgFrame>
      );
    case "message":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="3" y="5" width="18" height="13" rx="2.5" />
          <path d="M6 8l6 4 6-4" />
        </SvgFrame>
      );
    case "bell":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M8 17h8l-1.2-1.7V10a3.8 3.8 0 1 0-7.6 0v5.3L8 17Z" />
          <path d="M10.2 18.5a1.8 1.8 0 0 0 3.6 0" />
        </SvgFrame>
      );
    case "instagram":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.6" />
          <circle cx="16.8" cy="7.3" r="0.8" fill="currentColor" stroke="none" />
        </SvgFrame>
      );
    case "facebook":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <path d="M13.8 8.3h1.8V6h-1.9c-2 0-3 .9-3 2.8v1.3H9v2.2h1.7V18h2.3v-5.7h2.3l.4-2.2h-2.7V9.2c0-.6.3-.9.8-.9Z" />
        </SvgFrame>
      );
    case "tiktok":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M14.7 6.2c.8 1.2 1.8 1.9 3.3 2.1v2.2c-1.2-.1-2.2-.4-3.2-1.1v4.2a4 4 0 1 1-4-4h.4v2.2h-.4a1.8 1.8 0 1 0 1.8 1.8V5.9h2.1Z" />
        </SvgFrame>
      );
    case "youtube":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="3.5" y="6.5" width="17" height="11" rx="3" />
          <path d="M11 10l4 2.1-4 2.1V10Z" fill="currentColor" stroke="none" />
        </SvgFrame>
      );
    case "whatsapp":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M12 4.2a7.7 7.7 0 0 0-6.7 11.4L4.4 20l4.5-1a7.8 7.8 0 1 0 3.1-14.8Z" />
          <path d="M9.1 9.2c.2-.4.5-.4.8-.4h.5c.2 0 .4 0 .6.5l.7 1.5c.1.2.1.4 0 .6-.1.2-.2.3-.4.5l-.4.4c-.1.1-.2.2-.1.4.2.4.7 1.3 1.8 2 .8.6 1.4.7 1.8.8.2 0 .4 0 .5-.2l.6-.8c.1-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.4 0 .3-.1 1-.5 1.5-.4.4-.8.5-1.3.5-.4 0-.9 0-2-.5-1.8-.8-3.7-2.8-4.2-3.5-.5-.7-.9-1.5-.9-2.4 0-1 .5-1.6.7-1.9Z" />
        </SvgFrame>
      );
    case "x":
      return (
        <SvgFrame className={className} title={title}>
          <path d="M6.1 5h3.2l2.8 3.9L15.5 5H18l-4.6 5.5L18.8 19h-3.2l-3.1-4.3L8.7 19H6.2l4.9-5.9L5.8 5z" />
        </SvgFrame>
      );
    case "linkedin":
      return (
        <SvgFrame className={className} title={title}>
          <rect x="4" y="4" width="16" height="16" rx="3.6" />
          <path d="M8 10.1v6M8 7.8h.01M11.3 16.1v-3.5c0-1.6.9-2.5 2.1-2.5 1.2 0 2 .8 2 2.4v3.6" />
        </SvgFrame>
      );
    case "web":
      return (
        <SvgFrame className={className} title={title}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c1.7 2.1 2.7 5.4 2.7 8.5S13.7 18.4 12 20.5M12 3.5c-1.7 2.1-2.7 5.4-2.7 8.5s1 6.4 2.7 8.5" />
        </SvgFrame>
      );
    case "spark":
    default:
      return (
        <SvgFrame className={className} title={title}>
          <path d="M12 3l1.5 4.3L18 9l-4.5 1.7L12 15l-1.5-4.3L6 9l4.5-1.7L12 3Z" />
          <path d="M18.5 14.5l.8 2 .7-2 .8-.7-2.3-.8-.7-2-.8 2-2 .8 2 .7Z" />
        </SvgFrame>
      );
  }
}

"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

export const site_navigation_event = "form:site-navigation";

// แจ้ง navbar แม้ Next.js เปลี่ยนเฉพาะ hash โดยไม่มี hashchange
type site_link_props = Omit<
  ComponentProps<typeof Link>,
  "href" | "onNavigate"
> & {
  href: string;
};

export function SiteLink({ href, ...props }: site_link_props) {
  return (
    <Link
      {...props}
      href={href}
      onNavigate={() => {
        window.dispatchEvent(
          new CustomEvent(site_navigation_event, { detail: href }),
        );
      }}
    />
  );
}

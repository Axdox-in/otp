"use client";
import { usePathname } from "next/navigation";

/**
 * Remounts (via key=pathname) on every navigation so the entrance animation
 * replays — giving smooth page-to-page transitions.
 */
export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-in">
      {children}
    </div>
  );
}

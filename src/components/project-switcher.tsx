"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function ProjectSwitcher({
  projects,
  currentId,
}: {
  projects: { id: string; name: string }[];
  currentId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (projects.length === 0) return null;

  return (
    <select
      value={currentId}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("project", e.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="h-9 rounded-md border bg-background px-3 text-sm"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

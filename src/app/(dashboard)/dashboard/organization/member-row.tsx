"use client";
import { useState, useTransition } from "react";
import { Button, Badge } from "@/components/ui/primitives";
import { updateMemberRole, removeMember } from "./actions";
import type { Database } from "@/types/db";

const ROLES: Database["member_role"][] = ["owner", "admin", "developer", "viewer"];

export function MemberRow({
  member,
  isSelf,
}: {
  member: { member_id: string; email: string; full_name: string | null; role: Database["member_role"] };
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState(member.role);

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="font-medium">{member.full_name ?? member.email}</div>
        <div className="text-xs text-muted-foreground">{member.email}</div>
      </td>
      <td className="px-4 py-3">
        {isSelf ? (
          <Badge tone="muted">{role} (you)</Badge>
        ) : (
          <select
            value={role}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value as Database["member_role"];
              setRole(next);
              start(() => updateMemberRole(member.member_id, next));
            }}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <Button
            variant="ghost" size="sm" disabled={pending}
            onClick={() => { if (confirm("Remove this member?")) start(() => removeMember(member.member_id)); }}
          >
            Remove
          </Button>
        )}
      </td>
    </tr>
  );
}

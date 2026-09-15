"use client";
import { useState } from "react";
import { Card, Button, Input } from "@/components/ui/primitives";
import { createApiKey } from "./actions";

export function CreateKeyForm({ projectId }: { projectId: string }) {
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const res = await createApiKey(formData);
      setCreatedKey(res.fullKey);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mb-6 p-5">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="project_id" value={projectId} />
        <Input name="name" placeholder="Key name" defaultValue="default" className="max-w-[180px]" />
        <select name="env" className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="test">test</option>
          <option value="live">live</option>
        </select>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create key"}</Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {createdKey && (
        <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">Copy your key now — it won&apos;t be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 text-sm">{createdKey}</code>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(createdKey)}>
              Copy
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

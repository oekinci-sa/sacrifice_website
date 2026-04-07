"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Check, Pencil, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface NameCellProps {
  userId: string;
  initialName: string;
}

export function NameCell({ userId, initialName }: NameCellProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [displayName, setDisplayName] = useState(initialName || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startEdit = useCallback(() => {
    setName(displayName);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [displayName]);

  const cancel = useCallback(() => {
    setEditing(false);
    setName(displayName);
  }, [displayName]);

  const save = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === displayName) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      setDisplayName(trimmed);
      setEditing(false);
      window.dispatchEvent(new CustomEvent("user-updated"));
      toast({ title: "Güncellendi", description: "Kullanıcı adı başarıyla güncellendi." });
    } catch {
      toast({ title: "Hata", description: "İsim güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [name, displayName, userId, cancel, toast]);

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-7 w-40 text-sm"
          disabled={saving}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={save} disabled={saving || !name.trim()}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancel} disabled={saving}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1 min-w-0">
      <span className="truncate font-medium">{displayName || "—"}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={startEdit}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

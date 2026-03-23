"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { MailRecipientRow } from "@/lib/mail-recipient-rows";
import { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

export type { MailRecipientRow } from "@/lib/mail-recipient-rows";

export const MAIL_RECIPIENT_COLUMN_LABELS: Record<string, string> = {
  select: "Seç",
  mailSahibi: "Mail Sahibi",
  mailAdresi: "Mail Adresi",
  kaynakParcalari: "Kaynak",
};

export function createMailRecipientColumns(
  selected: Set<string>,
  onToggleEmail: (rawEmail: string) => void
): ColumnDef<MailRecipientRow>[] {
  return [
    {
      id: "select",
      header: () => <span className="sr-only">Seç</span>,
      cell: ({ row }) => {
        const key = row.original.normalizedEmail;
        const can = row.original.canSend && !!key;
        return (
          <Checkbox
            checked={can ? selected.has(key) : false}
            disabled={!can}
            onCheckedChange={() => {
              if (can) onToggleEmail(row.original.mailAdresi);
            }}
            aria-label={`${row.original.mailSahibi} — ${row.original.mailAdresi}`}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "mailSahibi",
      header: "Mail Sahibi",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.mailSahibi}</span>
      ),
    },
    {
      accessorKey: "mailAdresi",
      header: "Mail Adresi",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.mailAdresi}</span>
      ),
    },
    {
      id: "kaynakParcalari",
      header: "Kaynak",
      cell: ({ row }) => {
        const parts = row.original.kaynakParcalari;
        return (
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-snug">
            {parts.map((p, i) => (
              <React.Fragment key={`${p}-${i}`}>
                {i > 0 ? (
                  <span className="text-muted-foreground/50 select-none" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span>{p}</span>
              </React.Fragment>
            ))}
          </span>
        );
      },
    },
  ];
}

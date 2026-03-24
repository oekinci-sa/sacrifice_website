"use client";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

export type MismatchedShareRow = {
  sacrifice_id: string;
  tenant_id: string;
  sacrifice_year: number;
  sacrifice_no: number;
  shareholder_count: number;
  empty_share: number;
  notes?: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
};

const SacrificeNoCell = ({ sacrificeNo }: { sacrificeNo: number; sacrificeId?: string }) => (
  <span>{sacrificeNo}</span>
);

const AcknowledgeButton = ({
  sacrificeId,
  onAcknowledge,
  isAcknowledging,
}: {
  sacrificeId: string;
  onAcknowledge: (id: string) => void;
  isAcknowledging: boolean;
}) => (
  <Button
    size="sm"
    variant="outline"
    onClick={() => onAcknowledge(sacrificeId)}
    disabled={isAcknowledging}
  >
    {isAcknowledging ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Kaydediliyor…
      </>
    ) : (
      "Tamam biliyorum"
    )}
  </Button>
);

const RevokeButton = ({
  sacrificeId,
  onRevoke,
  isRevoking,
}: {
  sacrificeId: string;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) => (
  <Button
    size="sm"
    variant="outline"
    className="text-amber-600 border-amber-200 hover:bg-amber-50"
    onClick={() => onRevoke(sacrificeId)}
    disabled={isRevoking}
  >
    {isRevoking ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Geri alınıyor…
      </>
    ) : (
      "Geri Al"
    )}
  </Button>
);

export function createColumns(
  onAcknowledge: (id: string) => void,
  acknowledgingId: string | null,
  onRevoke?: (id: string) => void,
  revokingId?: string | null
): ColumnDef<MismatchedShareRow>[] {
  return [
    {
      id: "sacrifice_no",
      accessorKey: "sacrifice_no",
      header: "Kurban No",
      enableSorting: true,
      cell: ({ row }) => (
        <SacrificeNoCell
          sacrificeNo={row.original.sacrifice_no}
          sacrificeId={row.original.sacrifice_id}
        />
      ),
    },
    {
      accessorKey: "shareholder_count",
      header: "Hissedar",
      enableSorting: true,
      cell: ({ row }) => row.getValue("shareholder_count"),
    },
    {
      accessorKey: "empty_share",
      header: "Boş Hisse",
      enableSorting: true,
      cell: ({ row }) => row.getValue("empty_share"),
    },
    {
      id: "sacrifice_notes",
      accessorFn: (row) => row.notes ?? "",
      header: "Kurbanlık Notları",
      enableSorting: false,
      cell: ({ row }) => {
        const n = row.original.notes;
        const text = n != null && String(n).trim() !== "" ? String(n).trim() : "—";
        return (
          <span className="text-sm max-w-[min(280px,40vw)] inline-block align-top whitespace-pre-wrap break-words">
            {text}
          </span>
        );
      },
    },
    {
      id: "acknowledgment",
      accessorFn: (row) => row.acknowledged_at ?? "",
      header: "Farkındalık",
      enableSorting: true,
      cell: ({ row }) => {
        const { acknowledged_at, acknowledged_by } = row.original;
        if (acknowledged_at) {
          return (
            <span className="text-sm text-muted-foreground">
              {acknowledged_by} •{" "}
              {new Date(acknowledged_at).toLocaleDateString("tr-TR")}
            </span>
          );
        }
        return <span className="text-sm text-amber-600">Bekleniyor</span>;
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        !row.original.acknowledged_at ? (
          <AcknowledgeButton
            sacrificeId={row.original.sacrifice_id}
            onAcknowledge={onAcknowledge}
            isAcknowledging={acknowledgingId === row.original.sacrifice_id}
          />
        ) : onRevoke ? (
          <RevokeButton
            sacrificeId={row.original.sacrifice_id}
            onRevoke={onRevoke}
            isRevoking={revokingId === row.original.sacrifice_id}
          />
        ) : null,
    },
  ];
}

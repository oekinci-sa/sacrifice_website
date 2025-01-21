"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ActivityLog {
  event_id: string;
  table_name: string;
  row_id: string;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  changed_at: string;
  change_owner: string;
}

interface ActivityTableProps {
  data?: ActivityLog[];
}

export function ActivityTable({ data = [] }: ActivityTableProps) {
  const [filterType, setFilterType] = useState<"all" | "Ekleme" | "Güncelleme" | "Silme">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data based on type and search term
  const filteredData = data.filter((log) => {
    const matchesType = filterType === "all" || log.change_type === filterType;
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.row_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="İşlem ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="İşlem türü seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="Ekleme">Ekleme</SelectItem>
            <SelectItem value="Güncelleme">Güncelleme</SelectItem>
            <SelectItem value="Silme">Silme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlem</TableHead>
              <TableHead>Tablo</TableHead>
              <TableHead className="hidden md:table-cell">Açıklama</TableHead>
              <TableHead>Kullanıcı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((log) => (
              <TableRow key={log.event_id}>
                <TableCell className="font-medium">
                  {format(new Date(log.changed_at), "dd MMM yyyy HH:mm", { locale: tr })}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      log.change_type === "Ekleme"
                        ? "bg-green-50 text-green-700 ring-green-600/20"
                        : log.change_type === "Güncelleme"
                        ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                        : "bg-red-50 text-red-700 ring-red-600/20"
                    }`}
                  >
                    {log.change_type}
                  </span>
                </TableCell>
                <TableCell>{log.table_name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-md truncate">
                  {log.description}
                </TableCell>
                <TableCell>{log.change_owner}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 
"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { shareholderSchema } from "@/types";
import { debounce } from "lodash";

interface ShareholderFilterProps {
  shareholders: shareholderSchema[];
  onFilter: (filtered: shareholderSchema[]) => void;
}

export function ShareholderFilter({ shareholders, onFilter }: ShareholderFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtreleme işlemini debounce ile optimize edelim
  const debouncedFilter = debounce((term: string) => {
    if (!term.trim()) {
      onFilter(shareholders);
      return;
    }

    const normalizedTerm = term.toLowerCase().trim();
    const filtered = shareholders.filter((shareholder) => {
      return (
        shareholder.shareholder_name.toLowerCase().includes(normalizedTerm) ||
        shareholder.phone_number.includes(normalizedTerm) ||
        (shareholder.sacrifice?.sacrifice_no?.toString().includes(normalizedTerm))
      );
    });

    onFilter(filtered);
  }, 300);

  useEffect(() => {
    debouncedFilter(searchTerm);
    
    // Cleanup
    return () => {
      debouncedFilter.cancel();
    };
  }, [searchTerm, shareholders, debouncedFilter]);

  return (
    <div className="relative my-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Hissedar adı, telefon veya kurbanlık no ile ara..."
        className="pl-10 h-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
} 
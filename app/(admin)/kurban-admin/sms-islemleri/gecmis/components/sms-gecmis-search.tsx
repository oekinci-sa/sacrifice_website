"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

interface SmsGecmisSearchProps {
  onSearch: (value: string) => void;
  className?: string;
}

export function SmsGecmisSearch({ onSearch, className }: SmsGecmisSearchProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className={cn("relative w-48 sm:w-56", className)}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Mesaj ile ara..."
        value={searchValue}
        onChange={handleSearch}
        className="pl-8 w-full"
      />
    </div>
  );
}

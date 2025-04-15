"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SacrificeSearchProps {
  onSearch: (value: string) => void;
  searchValue?: string;
}

export function SacrificeSearch({ onSearch, searchValue: externalSearchValue }: SacrificeSearchProps) {
  const [searchValue, setSearchValue] = useState("");

  // Update internal state when external value changes
  useEffect(() => {
    if (externalSearchValue !== undefined) {
      setSearchValue(externalSearchValue);
    }
  }, [externalSearchValue]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full md:w-1/4">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Kurban numarası veya notlar ile ara..."
        value={searchValue}
        onChange={handleSearch}
        className="pl-8 w-full"
      />
    </div>
  );
} 
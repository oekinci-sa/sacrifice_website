"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

interface ShareholderSearchProps {
  onSearch: (value: string) => void;
  className?: string;
}

export function ShareholderSearch({ onSearch, className }: ShareholderSearchProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Format the phone number by removing spaces if it looks like a phone number
    let formattedValue = value;

    // Check if the input is likely a phone number (contains more digits than other characters)
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length >= (value.length / 2)) {
      // If it looks like a phone number, remove all spaces
      formattedValue = value.replace(/\s+/g, '');
    }

    // Pass the formatted value to the search handler
    onSearch(formattedValue);
  };

  return (
    <div className={cn("relative w-48 sm:w-56", className)}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="İsim veya telefon numarası ile ara..."
        value={searchValue}
        onChange={handleSearch}
        className="pl-8 w-full"
      />
    </div>
  );
} 
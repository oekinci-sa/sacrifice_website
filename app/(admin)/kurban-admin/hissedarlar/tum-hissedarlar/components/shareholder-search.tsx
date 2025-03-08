"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface ShareholderSearchProps {
  onSearch: (value: string) => void;
}

export function ShareholderSearch({ onSearch }: ShareholderSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

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

  // Create a search query string
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Handle form submission
  const onSubmit = (data: SearchFormValues) => {
    // Format the phone number by removing spaces if it looks like a phone number
    let searchQuery = data.query;
    
    // Check if the input is likely a phone number (contains more digits than other characters)
    const digits = searchQuery.replace(/\D/g, '');
    if (digits.length > 0 && digits.length >= (searchQuery.length / 2)) {
      // If it looks like a phone number, remove all spaces
      searchQuery = searchQuery.replace(/\s+/g, '');
    }
    
    // Update the URL with the search query
    router.push(
      `${pathname}?${createQueryString({
        query: searchQuery || null,
      })}`
    );
  };

  return (
    <div className="mt-2 relative w-1/2">
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
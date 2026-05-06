"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

export type KurbanScope = "all" | "picked";

export interface SacrificeOptionRow {
  sacrifice_id: string;
  sacrifice_no: number;
}

interface Props {
  options: SacrificeOptionRow[];
  scope: KurbanScope;
  onScopeChange: (scope: KurbanScope) => void;
  pickedSacrificeNos: number[];
  onPickedNosChange: (nos: number[]) => void;
  disabled?: boolean;
}

const ALL_VALUE = "__sms_sac_all__";
const PICK_ALL_VALUE = "__sms_pick_all_nos__";

export function SmsSacrificePicker({
  options,
  scope,
  onScopeChange,
  pickedSacrificeNos,
  onPickedNosChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  const pickedSet = useMemo(
    () => new Set(pickedSacrificeNos),
    [pickedSacrificeNos]
  );

  const allOptionNos = useMemo(
    () => options.map((o) => o.sacrifice_no).sort((a, b) => a - b),
    [options]
  );

  const toggleNo = (no: number) => {
    onScopeChange("picked");
    const next = new Set(pickedSacrificeNos);
    if (next.has(no)) next.delete(no);
    else next.add(no);
    onPickedNosChange(Array.from(next).sort((a, b) => a - b));
  };

  const selectEntireYear = () => {
    onScopeChange("all");
    onPickedNosChange([]);
  };

  const selectAllListedNos = () => {
    onScopeChange("picked");
    onPickedNosChange([...allOptionNos]);
  };

  const triggerLabel =
    scope === "all"
      ? "Tüm kurbanlıklar (seçili yıl)"
      : pickedSacrificeNos.length === 0
        ? "Kurbanlık seçin…"
        : pickedSacrificeNos.length === 1
          ? `Kurbanlık ${pickedSacrificeNos[0]}`
          : `${pickedSacrificeNos.length} kurbanlık seçili`;

  return (
    <div className="space-y-2">
      <Label>Kurbanlık seçimi</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled || options.length === 0}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Kurbanlık no ara…" />
            <CommandList className="max-h-[min(320px,50vh)]">
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup heading="Kapsam">
                <CommandItem
                  value={ALL_VALUE}
                  onSelect={() => {
                    selectEntireYear();
                  }}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      scope === "all"
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 opacity-60 [&_svg]:invisible"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>Tüm kurbanlıklar (seçili yıl)</span>
                </CommandItem>
                <CommandItem
                  value={PICK_ALL_VALUE}
                  onSelect={() => {
                    selectAllListedNos();
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="pl-6 text-sm">Listeden tümünü seç</span>
                </CommandItem>
              </CommandGroup>
              <Separator className="my-1" />
              <CommandGroup heading="Kurbanlık no">
                {options.map((o) => {
                  const selected =
                    scope === "picked" && pickedSet.has(o.sacrifice_no);
                  return (
                    <CommandItem
                      key={o.sacrifice_id}
                      value={`${o.sacrifice_no}`}
                      onSelect={() => {
                        toggleNo(o.sacrifice_no);
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          selected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40 opacity-60 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>Kurbanlık {o.sacrifice_no}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

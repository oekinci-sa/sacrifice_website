"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplay } from "@/utils/formatters";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ShareholderInfoProps {
  shareholderInfo: shareholderSchema;
  isEditing: boolean;
  editFormData?: Partial<shareholderSchema>;
  handleChange?: (field: string, value: string | number | boolean) => void;
  sectionClass: string;
  labelClass: string;
  valueClass: string;
}

export function ShareholderInfo({
  shareholderInfo,
  isEditing,
  editFormData,
  handleChange,
  sectionClass,
  labelClass,
  valueClass
}: ShareholderInfoProps) {
  return (
    <div className={sectionClass}>
      <h3 className="text-lg md:text-xl font-semibold mb-4">Hissedar Bilgileri</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* İsim Soyisim */}
        <div className="space-y-1">
          <p className={labelClass}>İsim Soyisim</p>
          {isEditing ? (
            <Input
              value={editFormData?.shareholder_name}
              onChange={(e) => handleChange?.('shareholder_name', e.target.value)}
              placeholder="İsim Soyisim"
              className="h-9"
            />
          ) : (
            <p className={valueClass}>{shareholderInfo.shareholder_name}</p>
          )}
        </div>

        {/* Telefon */}
        <div className="space-y-1">
          <p className={labelClass}>Telefon</p>
          {isEditing ? (
            <Input
              value={editFormData?.phone_number?.startsWith('+90')
                ? '0' + editFormData.phone_number.substring(3)
                : editFormData?.phone_number}
              onChange={(e) => handleChange?.('phone_number', e.target.value)}
              placeholder="0555 555 55 55"
              className="h-9"
            />
          ) : (
            <p className={valueClass}>{formatPhoneForDisplay(shareholderInfo.phone_number)}</p>
          )}
        </div>

        {/* Teslimat Tercihi */}
        <div className="space-y-1">
          <p className={labelClass}>Teslimat Tercihi</p>
          {isEditing ? (
            <div className="flex gap-4 mt-1">
              <Button
                type="button"
                onClick={() => handleChange?.('delivery_location', 'Kesimhane')}
                className={cn(
                  "flex-1 border border-gray-200 transition-all",
                  editFormData?.delivery_location === "Kesimhane"
                    ? "bg-primary text-white"
                    : "bg-background hover:bg-muted text-foreground"
                )}
              >
                Kesimhane
              </Button>
              <Button
                type="button"
                onClick={() => handleChange?.('delivery_location', 'Ulus')}
                className={cn(
                  "flex-1 border border-gray-200 transition-all",
                  editFormData?.delivery_location === "Ulus"
                    ? "bg-primary text-white"
                    : "bg-background hover:bg-muted text-foreground"
                )}
              >
                Ulus (+750 TL)
              </Button>
            </div>
          ) : (
            <p className={valueClass}>
              {shareholderInfo.delivery_location === "Ulus" ? "Ulus (+750 TL)" : shareholderInfo.delivery_location}
            </p>
          )}
        </div>

        {/* Hisse Alım Tarihi */}
        <div className="space-y-1">
          <p className={labelClass}>Hisse Alım Tarihi</p>
          <p className={valueClass}>
            {format(new Date(shareholderInfo.purchase_time), "dd MMMM yyyy - HH:mm", { locale: tr })}
          </p>
        </div>

        {/* Vekalet Durumu */}
        <div className="space-y-1">
          <p className={labelClass}>Vekalet Durumu</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={editFormData?.sacrifice_consent}
                onCheckedChange={(checked) => handleChange?.('sacrifice_consent', checked)}
                id="sacrifice-consent"
              />
              <Label htmlFor="sacrifice-consent">
                {editFormData?.sacrifice_consent ? "Vekalet Alındı" : "Vekalet Alınmadı"}
              </Label>
            </div>
          ) : (
            <p className={cn(
              valueClass,
              shareholderInfo.sacrifice_consent ? "text-[#39C645]" : "text-[#D22D2D]"
            )}>
              {shareholderInfo.sacrifice_consent ? "Vekalet Alındı" : "Vekalet Alınmadı"}
            </p>
          )}
        </div>

        {/* Notlar - moved next to vekalet */}
        <div className="space-y-1">
          <p className={labelClass}>Notlar</p>
          {isEditing ? (
            <Textarea
              value={editFormData?.notes || ''}
              onChange={(e) => handleChange?.('notes', e.target.value)}
              placeholder="Hissedar ile ilgili notlar..."
              className="min-h-[80px]"
            />
          ) : (
            <p className={valueClass}>{shareholderInfo.notes || "Not bulunmuyor"}</p>
          )}
        </div>
      </div>
    </div>
  );
} 
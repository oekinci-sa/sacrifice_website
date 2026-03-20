"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDeliverySelectionFromLocation, getDeliveryTypeDisplayLabel } from "@/lib/delivery-options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLong } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";

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
  valueClass,
}: ShareholderInfoProps) {
  const branding = useTenantBranding();

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
                ? formatPhoneForDisplayWithSpacing(editFormData.phone_number)
                : editFormData?.phone_number ?? ""}
              onChange={(e) => handleChange?.('phone_number', e.target.value)}
              placeholder="0555 555 55 55"
              className="h-9"
            />
          ) : (
            <p className={valueClass}>{formatPhoneForDisplayWithSpacing(shareholderInfo.phone_number ?? "")}</p>
          )}
        </div>

        {/* Teslimat Tercihi — hisse alırken belirlenir; admin düzenlemesine kapalı */}
        <div className="space-y-1">
          <p className={labelClass}>Teslimat Tercihi</p>
          <p className={valueClass}>
            {getDeliveryTypeDisplayLabel(
              branding.logo_slug,
              getDeliverySelectionFromLocation(branding.logo_slug, shareholderInfo.delivery_location ?? ""),
              null,
              false
            )}
          </p>
        </div>

        {/* Hisse Alım Tarihi */}
        <div className="space-y-1">
          <p className={labelClass}>Hisse Alım Tarihi</p>
          <p className={valueClass}>
            {formatDateLong(shareholderInfo.purchase_time)}
          </p>
        </div>

        {/* Vekalet Durumu */}
        <div className="space-y-1">
          <p className={labelClass}>Vekalet Durumu</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={editFormData?.sacrifice_consent ?? false}
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
              shareholderInfo.sacrifice_consent ? "text-sac-primary" : "text-sac-red"
            )}>
              {shareholderInfo.sacrifice_consent ? "Vekalet Alındı" : "Vekalet Alınmadı"}
            </p>
          )}
        </div>

        {/* Güvenlik Kodu - add after vekalet */}
        <div className="space-y-1">
          <p className={labelClass}>Güvenlik Kodu</p>
          {isEditing ? (
            <Input
              value={editFormData?.security_code || ''}
              onChange={(e) => handleChange?.('security_code', e.target.value)}
              placeholder="Güvenlik kodu..."
              className="h-9"
            />
          ) : (
            <p className={valueClass}>{shareholderInfo.security_code || "Kod bulunmuyor"}</p>
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
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatPhoneForDisplay } from "@/utils/formatters";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { shareholderSchema } from "@/types";

interface ShareholderInfoProps {
  shareholderInfo: shareholderSchema;
  isEditing: boolean;
  editFormData: any;
  handleChange: (field: string, value: any) => void;
  sectionClass: string;
  labelClass: string;
  valueClass: string;
}

const getDeliveryLocationText = (location: string) => {
  switch (location) {
    case "kesimhane":
      return "Kesimhanede Teslim";
    case "yenimahalle-pazar-yeri":
      return "Yenimahalle Pazar Yeri";
    case "kecioren-otoparki":
      return "Keçiören Otoparkı";
    default:
      return location;
  }
};

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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* İsim Soyisim */}
        <div className="space-y-1">
          <p className={labelClass}>İsim Soyisim</p>
          {isEditing ? (
            <Input
              value={editFormData.shareholder_name}
              onChange={(e) => handleChange('shareholder_name', e.target.value)}
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
              value={editFormData.phone_number.startsWith('+90') 
                ? '0' + editFormData.phone_number.substring(3) 
                : editFormData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
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
            <Select 
              value={editFormData.delivery_location}
              onValueChange={(value) => handleChange('delivery_location', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Teslimat tercihi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kesimhane">Kesimhanede Teslim</SelectItem>
                <SelectItem value="yenimahalle-pazar-yeri">Yenimahalle Pazar Yeri</SelectItem>
                <SelectItem value="kecioren-otoparki">Keçiören Otoparkı</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className={valueClass}>{getDeliveryLocationText(shareholderInfo.delivery_location)}</p>
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
                checked={editFormData.sacrifice_consent}
                onCheckedChange={(checked) => handleChange('sacrifice_consent', checked)}
                id="sacrifice-consent"
              />
              <Label htmlFor="sacrifice-consent">
                {editFormData.sacrifice_consent ? "Vekalet Alındı" : "Vekalet Alınmadı"}
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
              value={editFormData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
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
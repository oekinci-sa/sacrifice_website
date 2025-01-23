"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareholderStatistics } from "./components/statistics";
import { supabase } from "@/utils/supabaseClient";
import { shareholderSchema } from "@/types";

export default function HissedarlarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hissedarlar</h1>
        <p className="text-muted-foreground">
          Hissedarların genel durumu ve detayları
        </p>
      </div>
      <ShareholderStatistics />
    </div>
  );
} 
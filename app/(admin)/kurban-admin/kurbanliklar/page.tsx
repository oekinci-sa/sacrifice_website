"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SacrificeStatistics } from "./components/statistics";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema } from "@/types";

export default function KurbanliklarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kurbanlıklar</h1>
        <p className="text-muted-foreground">
          Kurbanlıkların genel durumu ve detayları
        </p>
      </div>
      <SacrificeStatistics />
    </div>
  );
}

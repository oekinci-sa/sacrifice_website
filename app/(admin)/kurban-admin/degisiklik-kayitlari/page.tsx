"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ActivityTable } from "../genel-bakis/components/activity-table";

interface ActivityLog {
  event_id: string;
  table_name: string;
  row_id: string;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  changed_at: string;
  change_owner: string;
}

export default function ActivityLogsPage() {
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Fetch activity logs
        const { data: logsData, error: logsError } = await supabase
          .from("change_logs")
          .select("*")
          .order("changed_at", { ascending: false });

        if (logsError) throw logsError;

        // Transform logs data
        const transformedLogs = logsData.map(log => ({
          event_id: log.event_id,
          table_name: log.table_name,
          row_id: log.row_id,
          description: log.description,
          change_type: log.change_type as "Ekleme" | "Güncelleme" | "Silme",
          changed_at: log.changed_at,
          change_owner: log.change_owner
        }));

        setActivityLogs(transformedLogs);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Değişiklik Kayıtları</h1>
      <ActivityTable data={activityLogs} />
    </div>
  );
} 
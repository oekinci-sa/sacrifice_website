"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { supabase } from "@/utils/supabaseClient";
import { ActivityTable } from "./components/activity-table";

interface DashboardStats {
  totalSacrifices: number;
  remainingSacrifices: number;
  totalShares: number;
  emptyShares: number;
  totalPayments: number;
  completedPayments: number;
  overdueDeposits: number;
  pendingPayments: number;
  todaysSales: number;
  todaysPayments: number;
}

interface DailyShareData {
  date: string;
  count: number;
}

interface PaymentStatusData {
  status: string;
  value: number;
  color: string;
}

interface ActivityLog {
  id: string;
  table_name: string;
  row_id: string;
  description: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  changed_at: string;
  change_owner: string;
}

export default function GeneralOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSacrifices: 0,
    remainingSacrifices: 0,
    totalShares: 0,
    emptyShares: 0,
    totalPayments: 0,
    completedPayments: 0,
    overdueDeposits: 0,
    pendingPayments: 0,
    todaysSales: 0,
    todaysPayments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [dailyShares, setDailyShares] = useState<DailyShareData[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch sacrifices data
        const { data: sacrifices, error: sacrificesError } = await supabase
          .from("sacrifice_animals")
          .select("*");

        if (sacrificesError) throw sacrificesError;

        // Fetch shareholders data
        const { data: shareholders, error: shareholdersError } = await supabase
          .from("shareholders")
          .select("*");

        if (shareholdersError) throw shareholdersError;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate statistics
        const totalSacrifices = sacrifices?.length || 0;
        const remainingSacrifices = sacrifices?.filter(s => s.empty_share > 0).length || 0;
        
        const totalShares = sacrifices?.reduce((acc, curr) => acc + 7, 0) || 0;
        const emptyShares = sacrifices?.reduce((acc, curr) => acc + (curr.empty_share || 0), 0) || 0;
        
        const totalPayments = shareholders?.length || 0;
        const completedPayments = shareholders?.filter(s => s.payment_status === "paid").length || 0;

        // Calculate overdue deposits (3 days after purchase)
        const overdueDeposits = shareholders?.filter(s => 
          new Date(s.purchase_time) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && 
          s.deposit_payment === 0
        ).length || 0;

        const pendingPayments = shareholders?.filter(s => s.payment_status === "pending").length || 0;

        // Calculate today's statistics
        const todaysSales = shareholders?.filter(s => 
          new Date(s.purchase_time).toDateString() === today.toDateString()
        ).length || 0;

        const todaysPayments = shareholders?.filter(s => 
          s.payment_status === "paid" && 
          new Date(s.purchase_time).toDateString() === today.toDateString()
        ).length || 0;

        // Son 7 günün tarihlerini oluştur
        const last7Days = eachDayOfInterval({
          start: subDays(new Date(), 6),
          end: new Date()
        });

        // Günlük hisse alımlarını hesapla
        const dailySharesData = last7Days.map(date => {
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          const count = shareholders?.filter(s => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= dayStart && purchaseDate <= dayEnd;
          }).length || 0;

          return {
            date: format(date, 'dd MMM', { locale: tr }),
            count
          };
        });

        // Ödeme durumu dağılımını hesapla
        const paid = shareholders?.filter(s => s.payment_status === "paid").length || 0;
        const pending = shareholders?.filter(s => s.payment_status === "pending").length || 0;

        const paymentStatusData = [
          { status: 'Tamamlandı', value: paid, color: '#22c55e' },
          { status: 'Bekliyor', value: pending, color: '#eab308' },
        ];

        // Fetch activity logs
        const { data: logs, error: logsError } = await supabase
          .from("change_logs")
          .select("*")
          .order("changed_at", { ascending: false });

        if (logsError) throw logsError;

        setActivityLogs(logs || []);

        setDailyShares(dailySharesData);
        setPaymentStatus(paymentStatusData);

        setStats({
          totalSacrifices,
          remainingSacrifices,
          totalShares,
          emptyShares,
          totalPayments,
          completedPayments,
          overdueDeposits,
          pendingPayments,
          todaysSales,
          todaysPayments,
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const paymentChartData = [
    {
      name: 'Ödemeler',
      'Geciken Kapora': stats.overdueDeposits,
      'Bekleyen Ödeme': stats.pendingPayments,
      'Tamamlanan': stats.completedPayments,
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Günlük KPI'lar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Satışlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaysSales}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'd MMMM yyyy', { locale: tr })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaysPayments}</div>
            <p className="text-xs text-muted-foreground">
              Tamamlanan ödemeler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geciken Kapora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueDeposits}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                3 günden fazla geciken
              </p>
              <Link href="/kurban-admin/odeme-analizi">
                <Button variant="link" size="sm" className="h-8">
                  Detaylar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Tüm bekleyen ödemeler
              </p>
              <Link href="/kurban-admin/odeme-analizi">
                <Button variant="link" size="sm" className="h-8">
                  Detaylar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Barlar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kurbanlık Durumu</CardTitle>
            <span className="text-xs text-muted-foreground">
              {stats.remainingSacrifices}/{stats.totalSacrifices}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.remainingSacrifices / stats.totalSacrifices) * 100).toFixed(1)}%
            </div>
            <Progress 
              value={(stats.remainingSacrifices / stats.totalSacrifices) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Kalan kurbanlık sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hisse Durumu</CardTitle>
            <span className="text-xs text-muted-foreground">
              {stats.emptyShares}/{stats.totalShares}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.emptyShares / stats.totalShares) * 100).toFixed(1)}%
            </div>
            <Progress 
              value={(stats.emptyShares / stats.totalShares) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Boştaki hisse sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ödeme Durumu</CardTitle>
            <span className="text-xs text-muted-foreground">
              {stats.completedPayments}/{stats.totalPayments}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.completedPayments / stats.totalPayments) * 100).toFixed(1)}%
            </div>
            <Progress 
              value={(stats.completedPayments / stats.totalPayments) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tamamlanan ödemeler
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yeni Grafikler */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günlük Hisse Alımları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyShares}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ödeme Durumu Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ödeme Grafiği */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Geciken Kapora" fill="#ef4444" />
                <Bar dataKey="Bekleyen Ödeme" fill="#eab308" />
                <Bar dataKey="Tamamlanan" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Son İşlemler */}
      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTable data={activityLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
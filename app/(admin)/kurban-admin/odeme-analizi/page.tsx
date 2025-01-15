"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

interface PaymentData {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  purchase_time: string;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;
}

export default function PaymentAnalysis() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overdue-deposits");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const { data, error } = await supabase
          .from("shareholders")
          .select("*");

        if (error) throw error;

        setPayments(data || []);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overdueDeposits = payments.filter(
    (p) => 
      new Date(p.purchase_time) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && 
      p.paid_amount < 2000
  );

  const pendingPayments = payments.filter(
    (p) => p.paid_amount >= 2000 && p.remaining_payment > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ödeme Analizi</h2>
        <p className="text-muted-foreground">
          Geciken kaporalar ve bekleyen ödemelerin detaylı analizi
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overdue-deposits" className="flex items-center gap-2">
            Geciken Kaporalar
            <Badge variant="destructive" className="ml-2">
              {overdueDeposits.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending-payments" className="flex items-center gap-2">
            Bekleyen Ödemeler
            <Badge variant="secondary" className="ml-2">
              {pendingPayments.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue-deposits">
          <Card>
            <CardHeader>
              <CardTitle>Geciken Kaporalar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>Ödenen Tutar</TableHead>
                    <TableHead>Kalan Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueDeposits.map((payment) => (
                    <TableRow key={payment.shareholder_id}>
                      <TableCell className="font-medium">
                        {payment.shareholder_name}
                      </TableCell>
                      <TableCell>{payment.phone_number}</TableCell>
                      <TableCell>
                        {format(new Date(payment.purchase_time), "dd MMM yyyy", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(payment.paid_amount)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(payment.remaining_payment)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">Kapora Gecikmiş</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${payment.shareholder_id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-payments">
          <Card>
            <CardHeader>
              <CardTitle>Bekleyen Ödemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>Ödenen Tutar</TableHead>
                    <TableHead>Kalan Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.shareholder_id}>
                      <TableCell className="font-medium">
                        {payment.shareholder_name}
                      </TableCell>
                      <TableCell>{payment.phone_number}</TableCell>
                      <TableCell>
                        {format(new Date(payment.purchase_time), "dd MMM yyyy", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(payment.paid_amount)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(payment.remaining_payment)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Kalan Ödeme Bekleniyor</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${payment.shareholder_id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

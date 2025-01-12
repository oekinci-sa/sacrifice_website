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
import { supabase } from "@/utils/supabaseClient";

interface PaymentData {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  purchase_time: string;
  total_amount_to_pay: number;
  deposit_payment: number;
  remaining_payment: number;
  payment_status: string;
  is_deposit_overdue: boolean;
}

export default function PaymentAnalysis() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const { data, error } = await supabase
          .from("shareholders")
          .select("*")
          .or("payment_status.eq.pending");

        if (error) throw error;

        // Process data to check for overdue deposits
        const processedData = (data || []).map(item => ({
          ...item,
          is_deposit_overdue: new Date(item.purchase_time) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            && item.deposit_payment === 0
        }));

        setPayments(processedData);
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

  const overdueDeposits = payments.filter(p => p.is_deposit_overdue);
  const pendingPayments = payments.filter(p => p.payment_status === "pending");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geciken Kaporalar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueDeposits.map((payment) => (
                  <TableRow key={payment.shareholder_id}>
                    <TableCell>{payment.shareholder_name}</TableCell>
                    <TableCell>{payment.phone_number}</TableCell>
                    <TableCell>
                      {format(new Date(payment.purchase_time), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Kapora Gecikmiş</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bekleyen Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Kalan Ödeme</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment) => (
                  <TableRow key={payment.shareholder_id}>
                    <TableCell>{payment.shareholder_name}</TableCell>
                    <TableCell>{payment.phone_number}</TableCell>
                    <TableCell>{payment.remaining_payment} ₺</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Ödeme Bekliyor</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
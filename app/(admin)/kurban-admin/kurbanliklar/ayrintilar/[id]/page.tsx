"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareholderFormValues, shareholderFormSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import { ShareholderForm } from "./shareholder-form";

interface Shareholder extends ShareholderFormValues {
  shareholder_id: string;
  purchase_time: string;
  last_edited_by: string;
}

export default function DetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from("shareholders")
        .select("*")
        .eq("sacrifice_no", id);

      if (error) {
        toast.error("Veri yüklenirken hata oluştu");
        console.error(error);
      } else if (data) {
        setShareholders(data);
      }
      setLoading(false);
    }

    fetchData();
  }, [id]);

  async function onSubmit(values: ShareholderFormValues, shareholderId: string) {
    try {
      const updateData = {
        ...values,
        vekalet: Boolean(values.vekalet)
      };

      const { error } = await supabase
        .from("shareholders")
        .update(updateData)
        .eq("shareholder_id", shareholderId);

      if (error) throw error;
      toast.success("Bilgiler başarıyla güncellendi");
    } catch (error) {
      toast.error("Güncelleme sırasında bir hata oluştu");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/kurban-admin/kurbanliklar">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Kurban No: {id}</h2>
        </div>
      </div>
      <Separator />

      <div className="container mx-auto">
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-7 gap-4">
                {shareholders.map((_, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {index + 1}. Hissedar
                  </TabsTrigger>
                ))}
              </TabsList>

              {shareholders.map((shareholder, index) => (
                <TabsContent key={index} value={index.toString()}>
                  <ShareholderForm
                    shareholder={shareholder}
                    index={index + 1}
                    onSubmit={onSubmit}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

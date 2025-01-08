"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import Table from "@/app/(public)/(hisse)/hisseal/components/Table";
import React, { useState } from "react";
import Checkout from "./components/Checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Page = () => {
  const [shareCount, setShareCount] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("tab-1");

  return (
    <div className="container flex flex-col space-y-12">
      <div className="font-heading font-bold text-4xl text-center">
        Hisse Al
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="mx-auto w-full"
      >
        <TabsList className="h-auto bg-red rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="tab-1"
            className="relative text-lg font-heading font-semibold rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            Hisse Seçim
          </TabsTrigger>
          <TabsTrigger
            value="tab-2"
            className="relative text-lg font-heading font-semibold rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            Hisse Onay
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Hisse Bilgileri Girişi</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Hisse Bilgileri Girişi</DialogTitle>
                <DialogDescription>
                  Kaç adet hisse almak istersiniz?
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="share-count" className="text-right">
                    Hisse Sayısı
                  </Label>
                  <Input
                    id="share-count"
                    type="number"
                    min={1}
                    value={shareCount || ""}
                    onChange={(e) => setShareCount(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <p>
                  Girdiğiniz hisse sayısı, sonraki adıma geçtiğinizde onay için
                  görünecektir.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="default"
                  onClick={() => {
                    setIsDialogOpen(false); // Dialog'u kapat
                    setActiveTab("tab-2"); // İkinci sekmeyi aktif yap
                  }}
                >
                  Save and Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="tab-2">
          <Checkout shareCount={shareCount}></Checkout>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;

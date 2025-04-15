"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useDeleteShareholder, useGetShareholders, useUpdateShareholder } from "@/hooks/useShareholders";
import { useUser } from "@/hooks/useUsers";
import { shareholderSchema } from "@/types";
import { format } from "date-fns";
import { ArrowLeft, Check, Edit, Trash2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShareholderDetails } from "../components/shareholder-details";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ShareholderDetailsPage({ params }: PageProps) {
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State for the current shareholder
  const [shareholder, setShareholder] = useState<shareholderSchema | null>(null);
  // State for delete dialog
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Add form data state for editing
  const [editFormData, setEditFormData] = useState<{
    shareholder_name: string;
    phone_number: string;
    delivery_location: "kesimhane" | "yenimahalle-pazar-yeri" | "kecioren-otoparki";
    sacrifice_consent: boolean;
    paid_amount: number;
    notes: string;
    delivery_fee: number;
  }>({
    shareholder_name: "",
    phone_number: "",
    delivery_location: "kesimhane",
    sacrifice_consent: false,
    paid_amount: 0,
    notes: "",
    delivery_fee: 0,
  });

  // Fetch all shareholders
  const { data: shareholders, isLoading } = useGetShareholders();

  const { data: session } = useSession();
  const { data: userData } = useUser(session?.user?.email);

  // Find the current shareholder by ID
  useEffect(() => {
    if (shareholders?.length) {
      const found = shareholders.find(s => s.shareholder_id === params.id);
      if (found) {
        setShareholder(found);

        // Initialize edit form data
        setEditFormData({
          shareholder_name: found.shareholder_name,
          phone_number: found.phone_number,
          delivery_location: found.delivery_location,
          sacrifice_consent: found.sacrifice_consent,
          paid_amount: found.paid_amount,
          notes: found.notes || "",
          delivery_fee: found.delivery_fee || 0,
        });
      }
    }
  }, [shareholders, params.id]);

  // Update mutation
  const updateMutation = useUpdateShareholder();
  // Delete mutation
  const deleteMutation = useDeleteShareholder();

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    // Reset form data from current shareholder data whenever edit mode is toggled
    if (shareholder) {
      setEditFormData({
        shareholder_name: shareholder.shareholder_name,
        phone_number: shareholder.phone_number,
        delivery_location: shareholder.delivery_location,
        sacrifice_consent: shareholder.sacrifice_consent,
        paid_amount: shareholder.paid_amount,
        notes: shareholder.notes || "",
        delivery_fee: shareholder.delivery_fee || 0,
      });
    }

    setIsEditing(true);
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    // If delivery_location is changing, update delivery_fee as well
    if (field === 'delivery_location') {
      const deliveryLocation = value as "kesimhane" | "yenimahalle-pazar-yeri" | "kecioren-otoparki";
      const deliveryFee = deliveryLocation !== 'kesimhane' ? 500 : 0;
      setEditFormData(prev => ({
        ...prev,
        delivery_location: deliveryLocation,
        delivery_fee: deliveryFee
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = () => {
    // Kullanıcı bilgisi yoksa işlemi engelle
    if (!userData?.name) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    // Create updated data object including last_edited_by
    const updatedData = {
      shareholder_name: editFormData.shareholder_name,
      phone_number: editFormData.phone_number,
      delivery_location: editFormData.delivery_location,
      sacrifice_consent: editFormData.sacrifice_consent,
      paid_amount: editFormData.paid_amount,
      notes: editFormData.notes,
      delivery_fee: editFormData.delivery_fee,
      last_edited_by: userData.name // Kullanıcı adını ekle
    };

    updateMutation.mutate({
      shareholderId: params.id,
      data: updatedData
    }, {
      onSuccess: () => {
        setShareholder(prevState => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            ...updatedData
          };
        });
        setIsEditing(false);
        toast({
          title: "Başarılı",
          description: "Hissedar bilgileri güncellendi.",
        });
      },
      onError: () => {
        toast({
          title: "Hata",
          description: "Hissedar bilgileri güncellenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(params.id, {
      onSuccess: () => {
        toast({
          title: "Başarılı",
          description: "Hissedar başarıyla silindi.",
        });
        router.push("/kurban-admin/hissedarlar/tum-hissedarlar");
      },
      onError: () => {
        toast({
          title: "Hata",
          description: "Hissedar silinirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!shareholder) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Hissedar Bulunamadı</h1>
        <p>Bu ID ile eşleşen bir hissedar bulunamadı.</p>
        <Button onClick={handleBack}>Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Hissedar Ayrıntıları</h1>

        {/* Son düzenleyen bilgisi */}
        <div className="text-sm text-muted-foreground">
          Son düzenleyen: <span className="font-medium">{shareholder.last_edited_by || "Belirtilmemiş"}</span> - {shareholder.last_edited_time ? format(new Date(shareholder.last_edited_time), "dd.MM.yyyy HH:mm") : ""}
        </div>

        <Button asChild>
          <Link href={`/kurban-admin/hissedarlar/duzenle/${shareholder.shareholder_id}`}>
            Düzenle
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Hissedar Ayrıntıları</h1>
        </div>

        {/* Conditional rendering of buttons based on edit state */}
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              {/* Save/Cancel buttons when in edit mode */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
                İptal
              </Button>
              <Button
                variant="default"
                className="gap-2"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
                Kaydet
              </Button>
            </>
          ) : (
            <>
              {/* Edit/Delete buttons when not in edit mode */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
                Düzenle
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Shareholder Details */}
      <ShareholderDetails
        shareholderInfo={shareholder}
        isEditing={isEditing}
        editFormData={editFormData}
        handleChange={handleChange}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hissedarı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, hissedar kaydını kalıcı olarak silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

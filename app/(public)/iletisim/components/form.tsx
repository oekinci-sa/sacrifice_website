"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(50, "İsim 50 karakterden uzun olamaz")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "İsim sadece harf içerebilir"),
  phone: z
    .string()
    .refine((val) => val.startsWith("0"), "Telefon numarası 0 ile başlamalıdır")
    .refine((val) => {
      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length === 11;
    }, "Telefon numarası 11 haneli olmalıdır")
    .refine((val) => val.startsWith("05"), "Telefon numarası 05XX ile başlamalıdır"),
  email: z.string().email("Geçerli bir email adresi giriniz").optional().or(z.literal("")),
  message: z
    .string()
    .min(10, "Mesaj en az 10 karakter olmalıdır")
    .max(1000, "Mesaj 1000 karakterden uzun olamaz")
    .trim(),
});

type FormData = z.infer<typeof formSchema>;

const Form = () => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          message: data.message,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Mesaj gönderilemedi");
      }

      toast({
        title: "Mesajınız alındı",
        description: "En kısa sürede size dönüş yapacağız.",
      });
      reset();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Mesaj gönderilemedi.",
      });
    }
  };

  return (
    <div className="p-4 h-auto border rounded-sm w-full lg:w-3/4">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-xs lg:text-sm">Adınız *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Adınızı ve soyadınızı girin"
            className={cn(
              errors.name && "border-red-500",
              "h-10 mt-1 text-sm lg:text-base"
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-xs lg:text-sm">{errors.name.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Telefon */}
          <div>
            <Label htmlFor="phone" className="text-xs lg:text-sm">Telefon Numarası *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="05XX XXX XX XX"
              className={cn(
                errors.phone && "border-red-500",
                "h-10 mt-1 text-sm lg:text-base"
              )}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs lg:text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* E-posta */}
          <div>
            <Label htmlFor="email" className="text-xs lg:text-sm">E-posta Adresi</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="isim@ornek.com"
              className={cn(
                errors.email && "border-red-500",
                "h-10 mt-1 text-sm lg:text-base"
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-xs lg:text-sm">{errors.email.message}</p>
            )}
          </div>
        </div>
        {/* Mesaj */}
        <div>
          <Label htmlFor="message" className="text-xs lg:text-sm">Mesajınız *</Label>
          <Textarea
            id="message"
            {...register("message")}
            placeholder="Mesajınızı buraya yazın..."
            className={cn(
              errors.message && "border-red-500",
              "mt-1 text-sm lg:text-base"
            )}
          />
          {errors.message && (
            <p className="text-red-500 text-xs lg:text-sm">{errors.message.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary text-white text-sm lg:text-base py-2 lg:py-3"
        >
          {isSubmitting ? "Gönderiliyor..." : "Mesaj gönder"}
        </Button>
      </form>
    </div>
  );
};

export default Form;

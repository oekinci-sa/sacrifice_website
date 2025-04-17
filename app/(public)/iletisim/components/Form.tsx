"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(50, "İsim 50 karakterden uzun olamaz")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "İsim sadece harf içerebilir"),
  phone: z
    .string()
    .refine(val => val.startsWith("0"), "Telefon numarası 0 ile başlamalıdır")
    .refine(val => {
      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length === 11;
    }, "Telefon numarası 11 haneli olmalıdır")
    .refine(val => val.startsWith("05"), "Telefon numarası 05 ile başlamalıdır"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  message: z
    .string()
    .min(10, "Mesaj en az 10 karakter olmalıdır")
    .max(1000, "Mesaj 1000 karakterden uzun olamaz")
    .trim(),
});

type FormData = z.infer<typeof formSchema>;

const Form = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <div className="p-4 h-auto border rounded-sm w-full lg:w-3/4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="email" className="text-xs lg:text-sm">E-posta Adresi *</Label>
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
          className="w-full bg-sac-primary hover:bg-sac-primary text-white text-sm lg:text-base py-2 lg:py-3"
        >
          Mesaj gönder
        </Button>
      </form>
    </div>
  );
};

export default Form;

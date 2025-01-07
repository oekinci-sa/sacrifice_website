"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Your name is required."),
  phone: z
  .string()
  .regex(
    /^\d{11}$/,
    "Telefon numarası 11 haneli olmalıdır ve 0 ile başlamalıdır. Örn: 05XX XXX XX XX"
  ),
  email: z.string().email("Invalid email address."),
  message: z.string().min(1, "Message is required."),
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
    <div className="p-4 h-auto border rounded-sm w-3/4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name">Adınız *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Adınızı ve soyadınızı girin"
            className={cn(errors.name && "border-red-500", "h-10 mt-1")}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Telefon */}
          <div>
            <Label htmlFor="phone">Telefon Numarası *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="05XX XXX XX XX"
              className={cn(errors.phone && "border-red-500", "h-10 mt-1")}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* E-posta */}
          <div>
            <Label htmlFor="email">E-posta Adresi *</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="isim@ornek.com"
              className={cn(errors.email && "border-red-500", "h-10 mt-1")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        </div>
        {/* Mesaj */}
        <div>
          <Label htmlFor="message">Mesajınız *</Label>
          <Textarea
            id="message"
            {...register("message")}
            placeholder="Mesajınızı buraya yazın..."
            className={cn(errors.message && "border-red-500", "h-32 mt-1")}
          />
          {errors.message && (
            <p className="text-red-500 text-sm">{errors.message.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white"
        >
          Send a message
        </Button>
      </form>
    </div>
  );
};

export default Form;

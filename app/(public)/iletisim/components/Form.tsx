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
  email: z.string().email("Invalid email address."),
  phone: z
    .string()
    .regex(
      /^\(\d{3}\) \d{2} \d{4}$/,
      "Phone number must be in the format (xxx) xx xxxx."
    ),
  company: z.string().min(1, "Company name is required."),
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
    <div className="p-4  h-auto border rounded-sm w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Your name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Full name"
              className={cn(errors.name && "border-red-500", "h-12")}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          {/* Email */}
          <div>
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="name@example.com"
              className={cn(errors.email && "border-red-500", "h-12")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone number *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="(xxx) xx xxxx"
              className={cn(errors.phone && "border-red-500", "h-12")}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>
          {/* Company */}
          <div>
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              {...register("company")}
              placeholder="Company name"
              className={cn(errors.company && "border-red-500")}
            />
            {errors.company && (
              <p className="text-red-500 text-sm">{errors.company.message}</p>
            )}
          </div>
        </div>
        {/* Message */}
        <div>
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            {...register("message")}
            placeholder="Write your message here..."
            className={cn(errors.message && "border-red-500")}
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

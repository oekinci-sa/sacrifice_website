"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShareholderFormValues, shareholderFormSchema } from "@/types";

interface ShareholderFormProps {
  shareholder: ShareholderFormValues;
  index: number;
  onSubmit: (values: ShareholderFormValues, shareholderId: string) => Promise<void>;
}

export function ShareholderForm({ shareholder, index, onSubmit }: ShareholderFormProps) {
  const form = useForm<ShareholderFormValues>({
    resolver: zodResolver(shareholderFormSchema),
    defaultValues: shareholder,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data, shareholder.shareholder_id))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shareholder_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İsim Soyisim</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vekalet"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Vekalet</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Kaydet</Button>
      </form>
    </Form>
  );
} 
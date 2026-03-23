import React, { useState } from 'react'
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeEmail } from "@/lib/email-utils"
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'

const RemindMe = () => {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Telefon numarası formatlama fonksiyonu
    const _formatPhoneNumber = (value: string) => {
        // Sadece rakamları al
        const numbers = value.replace(/\D/g, '');

        // Eğer numara boşsa, boş string döndür
        if (!numbers) return '';

        // Başında 0 varsa
        if (numbers.startsWith('0')) {
            if (numbers.length <= 4) return numbers;
            if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
            if (numbers.length <= 10) return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
            return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
        }

        // Başında 0 yoksa, otomatik ekle
        const withZero = '0' + numbers;
        if (withZero.length <= 4) return withZero;
        if (withZero.length <= 7) return `${withZero.slice(0, 4)} ${withZero.slice(4)}`;
        if (withZero.length <= 10) return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7)}`;
        return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7, 9)} ${withZero.slice(9, 11)}`;
    };

    // Telefon numarası doğrulama fonksiyonu
    const _validatePhoneNumber = (phone: string) => {
        const digitsOnly = phone.replace(/\D/g, '');
        if (!digitsOnly.startsWith('0')) return false;
        if (digitsOnly.length !== 11) return false;
        if (!digitsOnly.startsWith('05')) return false;
        return true;
    };

    const handleReminder = async (_e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
        if (!name) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen isim-soyisim giriniz.",
            });
            return;
        }
        if (!phone) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen telefon numarası giriniz.",
            });
            return;
        }

        if (!_validatePhoneNumber(phone)) {
            setError("Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)");
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)",
            });
            return;
        }

        setError(null);
        const phoneDigits = phone.replace(/\D/g, "");

        try {
            const checkRes = await fetch(`/api/reminder-requests/check?phone=${encodeURIComponent(phoneDigits)}`);
            const checkData = await checkRes.json();

            if (!checkRes.ok) {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: checkData.error || "Kontrol sırasında bir hata oluştu.",
                });
                return;
            }

            if (checkData.exists) {
                toast({
                    variant: "destructive",
                    title: "Zaten Kayıtlı",
                    description: "Bu telefon numarası daha önce kaydedilmiş. Bilgilendirme yapıldığında size ulaşacağız.",
                });
                return;
            }

            const res = await fetch("/api/reminder-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phoneDigits,
                    ...(email.trim() ? { email: normalizeEmail(email) } : {}),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: data.error || data.message || "Kayıt sırasında bir hata oluştu.",
                });
                return;
            }

            toast({
                title: "Kayıt Başarılı",
                description: "Bilgilendirme listesine eklendiniz. Güncel duyurular için size ulaşacağız.",
            });
            setName("");
            setPhone("");
            setEmail("");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.";
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Hata",
                description: errorMessage,
            });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = _formatPhoneNumber(e.target.value);
        setPhone(formattedValue);
        setError(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleReminder(e);
        }
    };

  return (
    <form>
        <FieldGroup>
            <FieldGroup className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field>
                    <Label htmlFor="name" className="text-sm font-medium">İsim-Soyisim</Label>
                    <Input
                        id="name"
                        value={name}
                        placeholder="Ali Yılmaz" 
                        onChange={(e) => setName(e.target.value)}
                        onKeyUp={handleKeyPress}
                        className={cn(
                                "h-9 text-sm md:h-9 focus-visible:ring-0 focus-visible:ring-offset-0",
                                error ? "border-destructive focus-visible:ring-destructive" : ""
                            )}
                    />
                </Field>
                <Field>
                    <Label htmlFor="phone" className="text-sm font-medium">Telefon Numarası</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="Telefon numaranızı giriniz."
                        value={phone}
                        onChange={handlePhoneChange}
                        onKeyUp={handleKeyPress}
                        className={cn(
                            "h-9 text-sm md:h-9 focus-visible:ring-0 focus-visible:ring-offset-0",
                            error ? "border-destructive focus-visible:ring-destructive" : ""
                        )}
                    />
                </Field>
                <Field className="md:col-span-2">
                    <Label htmlFor="reminder-email" className="text-sm font-medium">E-posta (isteğe bağlı)</Label>
                    <Input
                        id="reminder-email"
                        type="email"
                        autoComplete="email"
                        placeholder="ornek@eposta.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyUp={handleKeyPress}
                        className={cn(
                            "h-9 text-sm md:h-9 focus-visible:ring-0 focus-visible:ring-offset-0",
                            error ? "border-destructive focus-visible:ring-destructive" : ""
                        )}
                    />
                </Field>
                <Field className="md:col-span-2">
                    <Button onClick={handleReminder} type="button">
                        <div className='bi bi-bell-fill'/> Haber Ver</Button>
                </Field>
            </FieldGroup>

          </FieldGroup>
    </form>
  )
}

export default RemindMe
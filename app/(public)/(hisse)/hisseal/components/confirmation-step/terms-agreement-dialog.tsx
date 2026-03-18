"use client"

import { Button } from "@/components/ui/button"
import { useTenantBranding } from "@/hooks/useTenantBranding"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

interface TermsAgreementDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    onBackToSecurityCode: () => void
    securityCode: string
}

export default function TermsAgreementDialog({
    open,
    onOpenChange,
    onConfirm,
    onBackToSecurityCode,
    securityCode,
}: TermsAgreementDialogProps) {
    const [isAgreed, setIsAgreed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const branding = useTenantBranding()

    const handleConfirm = async () => {
        if (isLoading) return // Prevent double submission

        if (!isAgreed) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen sözleşmeyi onaylayınız."
            })
            return
        }

        setIsLoading(true)

        try {
            // Call the onConfirm callback to proceed with the approval
            await onConfirm();

            // Close the dialog once confirmed successfully
            onOpenChange(false);

            // Success message toast'unu kaldırıyoruz
            // toast({
            //    title: "Başarılı",
            //    description: "Hisse kaydınız başarıyla oluşturuldu."
            // })
        } catch (error) {
            // Daha detaylı hata mesajı gösterelim
            let errorMessage = "İşlem sırasında bir hata oluştu.";
            if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            }

            toast({
                variant: "destructive",
                title: "Hata",
                description: errorMessage
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setIsAgreed(false)
        setIsLoading(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="md:max-w-xl max-w-[95%] h-[80vh] flex flex-col p-0 gap-0"
                // Make the dialog take 80% of screen height
                style={{ maxHeight: '80vh' }}
            >
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-base md:text-lg text-center">
                        Kullanıcı Sözleşmesi
                    </DialogTitle>
                </DialogHeader>

                {/* Main scrollable content area */}
                <div className="flex-1 overflow-hidden px-6">

                    {/* Kodu değiştir - güvenlik kodu onay sonrası gösterilmez */}
                    <div className="flex items-center justify-start p-2 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBackToSecurityCode}
                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Kodu değiştir
                        </Button>
                    </div>

                    {/* Scrollable area with visible scrollbar */}
                    <ScrollArea className="h-[calc(100%-3rem)] pr-2 border rounded-md" type="always">
                        <div className="flex flex-col gap-2 md:gap-4 p-4 text-sm md:text-base text-muted-foreground">
                            {/* Enhanced agreement styling */}
                            <h3 className="text-base md:text-lg font-semibold text-primary mb:2 md:mb-4 text-center">
                                KURBANLIK HİSSE SÖZLEŞMESİ
                            </h3>

                            {/* Introduction - 1 */}
                            <p className="leading-relaxed">
                                Bu metin, kurban hissesi almak isteyen gönüllüler ile bu organizasyonu gönüllülük esasıyla yürüten ekibimiz arasında, sürecin karşılıklı olarak şeffaf, anlaşılır ve düzenli ilerlemesini sağlamak amacıyla hazırlanmıştır. Amacımız, ibadet niyetiyle yapılan bu hizmetin sorunsuz ve güvenilir şekilde gerçekleşmesidir.
                            </p>

                            {/* Introduction - 2 */}
                            <p className="leading-relaxed">

                                Lütfen aşağıdaki maddeleri dikkatlice okuyunuz. Hisse kaydı ve işlemleri sırasında bu şartları kabul etmiş sayılırsınız.
                            </p>

                            {/* Agreement terms - DB'den branding.agreement_terms */}
                            <div className="space-y-3">
                                {(branding.agreement_terms ?? []).map((term, index) => {
                                    const description =
                                        term.title === "Ödeme ve Kapora"
                                            ? `Her hisse için hisse alımdan itibaren ${branding.deposit_deadline_days} gün içerisinde en az ${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(branding.deposit_amount)}₺ kapora ödenmesi zorunludur. Kalan tutarın ise ${branding.full_payment_deadline_day} ${["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][branding.full_payment_deadline_month]} gününe kadar eksiksiz olarak tamamlanması beklenmektedir. Belirtilen tarihlere kadar ödeme tamamlanmazsa hisse hakkı iptal edilebilir.`
                                            : term.description;
                                    return (
                                        <div key={index} className="flex flex-col gap-0">
                                            <div className="flex gap-1">
                                                <p className="flex-shrink-0 justify-center font-medium ">
                                                    {index + 1}.
                                                </p>
                                                <div>
                                                    <p className="font-medium ">{term.title}</p>
                                                    <p className="leading-relaxed">{description}</p>
                                                    {branding.logo_slug === "elya-hayvancilik" && term.title === "Bilgilendirme ve Takip" && (
                                                        <p className="leading-relaxed mt-3 text-muted-foreground">
                                                            Kesimden 45 dakika önce kesimhanede bulunmanız gerekmektedir.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Not - Elya için farklı metin */}
                            <p className="leading-relaxed">
                                {branding.logo_slug === "elya-hayvancilik" ? (
                                    <>
                                        <b>Not:</b> Bu hizmet Elya Hayvancılık tarafından kurban hissesi almak isteyenlere kolaylık sağlamak amacıyla sunulmaktadır. İbadetin paylaşılması ve kolaylaştırılması hedeflenmektedir.
                                        <br />
                                        Siz değerli hissedarlarımızın bu sürece katkı sağlaması bizler için kıymetlidir.
                                    </>
                                ) : (
                                    <>
                                        <b>Not:</b> Bu hizmet <b>ticari bir faaliyet değildir.</b> Gönüllülük esasıyla yürütülmekte olup, ibadetin paylaşılması ve kolaylaştırılması amacı taşımaktadır.
                                        <br />
                                        Siz değerli hissedarlarımızın da bu anlayışla sürece katkı sağlaması bizler için kıymetlidir.
                                    </>
                                )}
                            </p>

                            {/* Add extra padding at the bottom for better scrolling experience */}
                            <div className="h-4"></div>


                        </div>
                    </ScrollArea>
                </div>

                {/* Fixed footer with checkbox and button */}
                <DialogFooter className="px-6 py-4 border-t flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex gap-2 items-center">
                        <Checkbox
                            id="terms"
                            checked={isAgreed}
                            onCheckedChange={(checked) => setIsAgreed(!!checked)}
                            className=""
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm md:text-base text-muted-foreground cursor-pointer"
                        >
                            Kullanıcı sözleşmesini okudum, kabul ediyorum.
                        </label>
                    </div>

                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !isAgreed}
                        className="w-full md:w-auto h-10 md:h-12 text-sm"
                    >
                        Onaylıyorum
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
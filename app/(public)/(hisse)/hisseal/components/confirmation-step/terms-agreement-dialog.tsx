"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"

interface TermsAgreementDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    onBackToSecurityCode: () => void
    securityCode: string // Pass the security code for display
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

    const handleConfirm = () => {
        if (isLoading) return // Prevent double submission

        if (!isAgreed) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen sözleşmeyi onaylayınız."
            })
            return
        }

        // Ensure security code is present
        if (!securityCode || securityCode.length !== 6) {
            toast({
                variant: "destructive",
                title: "Güvenlik Kodu Hatası",
                description: "Lütfen önce 6 haneli bir güvenlik kodu belirleyiniz."
            })
            onBackToSecurityCode()
            return
        }

        setIsLoading(true)

        try {
            // Call the onConfirm callback to proceed with the approval
            onConfirm()
            // Note: We don't reset loading state here because parent component will close the dialog
        } catch (error) {
            console.error("Onay işlemi sırasında hata:", error)
            toast({
                variant: "destructive",
                title: "Hata",
                description: "İşlem sırasında bir hata oluştu."
            })
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        // If loading, prevent close
        if (isLoading) return;
        
        setIsAgreed(false)
        setIsLoading(false)
        onOpenChange(false)
    }

    // Reset loading state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setIsLoading(false)
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-xl max-w-[95%] h-[80vh] flex flex-col p-0 gap-0"
                // Make the dialog take 80% of screen height
                style={{ maxHeight: '80vh' }}
            >
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-base sm:text-lg text-center">
                        Kullanıcı Sözleşmesi
                    </DialogTitle>
                </DialogHeader>

                {/* Main scrollable content area */}
                <div className="flex-1 overflow-hidden px-6">
                    <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-md mb-4">
                        <span className="text-xs sm:text-sm font-medium">Güvenlik Kodunuz:</span>
                        <span className="text-sm sm:text-base font-bold">{securityCode}</span>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBackToSecurityCode}
                            className="ml-auto text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Kodu yeniden al
                        </Button>
                    </div>

                    {/* Scrollable area with visible scrollbar */}
                    <ScrollArea className="h-[calc(100%-3rem)] pr-2 border rounded-md" type="always">
                        <div className="p-4 text-sm text-muted-foreground">
                            {/* Enhanced agreement styling */}
                            <h3 className="text-base font-semibold text-primary mb-4 text-center">
                                KURBANLIK HİSSE SÖZLEŞMESİ
                            </h3>
                            
                            <p className="mb-4 text-sm leading-relaxed">
                                Bu sözleşme, kurban satın alan kişi ("Hissedar") ile kurban satış hizmeti sunan 
                                şirket ("Şirket") arasında akdedilmiştir.
                            </p>
                            
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">1</div>
                                    <p className="pt-0.5">Hissedar, şirket tarafından belirlenen kurban bedelini öder ve kurbanın 
                                    belirtilen hisselerine sahip olur.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">2</div>
                                    <p className="pt-0.5">Şirket, kurbanın teminini, kesimini ve teslimini bu sözleşmede belirtilen 
                                    şartlara uygun olarak gerçekleştirmeyi taahhüt eder.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">3</div>
                                    <p className="pt-0.5">Hissedar, kurban kesimi için dini vekaleti şirkete verdiğini beyan eder.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">4</div>
                                    <p className="pt-0.5">Şirket, kurbanın İslami usullere uygun olarak kesilmesini sağlayacaktır.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">5</div>
                                    <p className="pt-0.5">Hissedar, kurban etinin teslim şeklini ve adresini belirtmekle yükümlüdür.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">6</div>
                                    <p className="pt-0.5">Kurban eti, kesim sonrası en kısa sürede ve hijyenik koşullarda teslim edilecektir.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">7</div>
                                    <p className="pt-0.5">Mücbir sebeplerden dolayı kurban kesimi veya eti tesliminde gecikmeler olabilir.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">8</div>
                                    <p className="pt-0.5">Bu hizmetle ilgili tüm bilgiler gizli tutulacak ve üçüncü şahıslarla paylaşılmayacaktır.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">9</div>
                                    <p className="pt-0.5">Tüm hisse sahipleri, bu sözleşmeyi kabul ederek kurban hissesine ortak olduklarını beyan ederler.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">10</div>
                                    <p className="pt-0.5">Teslimat adresi değişikliği, kesim günü öncesinde şirkete bildirilmelidir.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">11</div>
                                    <p className="pt-0.5">Şirket, kurbanlık hayvanların İslami usullere uygun bir şekilde kesileceğini taahhüt eder.</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center text-primary font-medium">12</div>
                                    <p className="pt-0.5">Ek ücret ödenmesi gereken durumlarda, bu ödeme kesim tarihinden önce yapılmalıdır.</p>
                                </div>
                            </div>
                            
                            {/* Add extra padding at the bottom for better scrolling experience */}
                            <div className="h-4"></div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer with checkbox and button */}
                <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="terms"
                            checked={isAgreed}
                            onCheckedChange={(checked) => setIsAgreed(!!checked)}
                            className="mt-1"
                            disabled={isLoading}
                        />
                        <label
                            htmlFor="terms"
                            className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
                        >
                            Kullanıcı sözleşmesini okudum, kabul ediyorum.
                        </label>
                    </div>

                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !isAgreed}
                        className="w-full sm:w-auto h-10 sm:h-12 text-sm"
                    >
                        {isLoading ? "İşleniyor..." : "Onaylıyorum"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
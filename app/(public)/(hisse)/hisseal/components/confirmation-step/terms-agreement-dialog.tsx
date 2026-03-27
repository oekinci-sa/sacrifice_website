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
import { useToast } from "@/components/ui/use-toast"
import { interpolateAgreementPlaceholders } from "@/lib/agreement-placeholders"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

interface TermsAgreementDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    onBackToSecurityCode: () => void
    securityCode: string
}

function splitParagraphs(text: string): string[] {
    return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
}

export default function TermsAgreementDialog({
    open,
    onOpenChange,
    onConfirm,
    onBackToSecurityCode,
    securityCode: _securityCode,
}: TermsAgreementDialogProps) {
    const [isAgreed, setIsAgreed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const branding = useTenantBranding()

    const handleAgreementChange = (checked: boolean) => {
        setIsAgreed(!!checked)
    }

    const handleConfirm = async () => {
        if (isLoading) return

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
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
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

    const introParagraphs = splitParagraphs(
        interpolateAgreementPlaceholders(branding.agreement_intro_text, branding)
    )
    const footerParagraphs = splitParagraphs(
        interpolateAgreementPlaceholders(branding.agreement_footer_text, branding)
    )

    const noticeAnchor = branding.agreement_notice_after_term_title?.trim() ?? ""
    const noticeBodyRaw = branding.agreement_notice_after_term_body?.trim() ?? ""

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
            <DialogContent
                className="md:max-w-xl max-w-[95%] h-[80vh] flex flex-col p-0 gap-0 min-h-0"
                style={{ maxHeight: '80vh' }}
            >
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="text-base md:text-lg text-center">
                        {branding.agreement_dialog_title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6">
                    <div className="flex items-center justify-start p-2 mb-2 shrink-0">
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

                    <div
                        className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 border rounded-md scroll-smooth"
                    >
                        <div className="flex flex-col gap-2 md:gap-4 p-4 text-sm md:text-base text-muted-foreground">
                            <h3 className="text-base md:text-lg font-semibold text-primary mb:2 md:mb-4 text-center">
                                {branding.agreement_main_heading}
                            </h3>

                            {introParagraphs.map((paragraph, i) => (
                                <p key={`intro-${i}`} className="leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}

                            <div className="space-y-3">
                                {(branding.agreement_terms ?? []).map((term, index) => {
                                    const description = interpolateAgreementPlaceholders(
                                        term.description,
                                        branding
                                    )
                                    const showNoticeAfterTerm =
                                        noticeAnchor.length > 0 &&
                                        noticeBodyRaw.length > 0 &&
                                        term.title.trim() === noticeAnchor
                                    const noticeText = showNoticeAfterTerm
                                        ? interpolateAgreementPlaceholders(noticeBodyRaw, branding)
                                        : ""
                                    return (
                                        <div key={index} className="flex flex-col gap-0">
                                            <div className="flex gap-1">
                                                <p className="flex-shrink-0 justify-center font-medium ">
                                                    {index + 1}.
                                                </p>
                                                <div>
                                                    <p className="font-medium ">{term.title}</p>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{description}</p>
                                                    {showNoticeAfterTerm && (
                                                        <p className="leading-relaxed mt-3 text-muted-foreground whitespace-pre-wrap">
                                                            {noticeText}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {footerParagraphs.map((paragraph, i) => (
                                <p key={`foot-${i}`} className="leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}

                            <div className="h-2" />
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t flex flex-col md:flex-row md:items-center gap-4 shrink-0">
                    <div className="flex gap-2 items-start w-full md:flex-1 min-w-0">
                        <Checkbox
                            id="terms"
                            checked={isAgreed}
                            onCheckedChange={(checked) => handleAgreementChange(!!checked)}
                            className="mt-0.5 shrink-0"
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm md:text-base leading-snug text-muted-foreground cursor-pointer"
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

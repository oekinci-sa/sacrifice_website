"use client";

import { StatCardWithProgress } from "@/components/custom-components/stat-card-with-progress";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { useMemo } from "react";

export function SummaryCards() {
    // Get data from stores
    const { sacrifices } = useSacrificeStore();
    const { shareholders } = useShareholderStore();

    // Calculate stats from store data
    const stats = useMemo(() => {
        if (sacrifices.length === 0 || shareholders.length === 0) {
            return {
                totalSacrifices: 0,
                completedSacrifices: 0,
                remainingSacrifices: 0,
                totalShares: 0,
                emptyShares: 0,
                filledShares: 0,
                totalShareholders: 0,
                remainingDeposits: 0,
                shareholdersWithIncompletePayments: 0,
                shareholdersWithCompletePayments: 0,
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
                fullyPaidSacrifices: 0,
                activeSacrificesCount: 0
            };
        }

        const totalShares = sacrifices.length * 7; // Each sacrifice has 7 shares
        const emptyShares = sacrifices.reduce(
            (sum, sacrifice) => sum + (sacrifice.empty_share || 0),
            0
        );
        const filledShares = totalShares - emptyShares;

        // Count sacrifices with no empty shares
        const completedSacrifices = sacrifices.filter(
            (s) => s.empty_share === 0
        ).length;

        const totalAmount = shareholders.reduce(
            (sum, shareholder) => sum + (shareholder.total_amount || 0),
            0
        );
        const paidAmount = shareholders.reduce(
            (sum, shareholder) => sum + (shareholder.paid_amount || 0),
            0
        );

        // Calculate remaining deposits (less than 5000 TL paid after 3 days)
        const remainingDeposits = shareholders.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            const threeDaysAfterPurchase = new Date(purchaseDate);
            threeDaysAfterPurchase.setDate(threeDaysAfterPurchase.getDate() + 3);

            return s.paid_amount < 5000 && new Date() > threeDaysAfterPurchase;
        }).length;

        // Calculate shareholders with incomplete payments
        const shareholdersWithIncompletePayments = shareholders.filter(
            (s) => s.paid_amount < s.total_amount
        ).length;

        const shareholdersWithCompletePayments = shareholders.filter(
            (s) => s.paid_amount >= s.total_amount
        ).length;

        // Calculate fully paid sacrifices
        // First, get all sacrifices with at least one share taken (active sacrifices)
        const activeSacrifices = sacrifices.filter(s => s.empty_share < 7);
        const activeSacrificesCount = activeSacrifices.length;

        // Group shareholders by sacrifice_id
        const sacrificesMap = new Map();

        shareholders.forEach(shareholder => {
            const sacrificeId = shareholder.sacrifice_id;
            if (!sacrificesMap.has(sacrificeId)) {
                sacrificesMap.set(sacrificeId, {
                    shareholders: []
                });
            }

            sacrificesMap.get(sacrificeId).shareholders.push({
                totalAmount: shareholder.total_amount,
                paidAmount: shareholder.paid_amount,
                remainingPayment: shareholder.total_amount - shareholder.paid_amount
            });
        });

        // Count sacrifices where all shareholders have paid in full
        const fullyPaidSacrifices = Array.from(sacrificesMap.entries()).filter(
            ([sacrificeId, data]) => {
                // Check if this is an active sacrifice
                const isSacrificeActive = activeSacrifices.some(s => s.sacrifice_id === sacrificeId);
                if (!isSacrificeActive) return false;

                // Check if all shareholders have paid in full
                return data.shareholders.every((shareholder: { remainingPayment: number }) =>
                    shareholder.remainingPayment <= 0
                );
            }
        ).length;

        return {
            totalSacrifices: sacrifices.length,
            completedSacrifices,
            remainingSacrifices: sacrifices.length - completedSacrifices,
            totalShares,
            emptyShares,
            filledShares,
            totalShareholders: shareholders.length,
            remainingDeposits,
            shareholdersWithIncompletePayments,
            shareholdersWithCompletePayments,
            totalAmount,
            paidAmount,
            remainingAmount: totalAmount - paidAmount,
            fullyPaidSacrifices,
            activeSacrificesCount
        };
    }, [sacrifices, shareholders]);

    return (
        <div className="flex flex-col space-y-8">
            {/* First row - 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCardWithProgress
                    title="Hissesi Dolu Kurbanlıklar"
                    value={stats.remainingSacrifices}
                    maxValue={stats.totalSacrifices}
                    displayValue={stats.completedSacrifices}
                    actionLink={{
                        text: "Tümünü göster",
                        href: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
                    }}
                />
                <StatCardWithProgress
                    title="Ödemesi Tamamlanan Kurbanlıklar"
                    value={stats.fullyPaidSacrifices}
                    maxValue={stats.activeSacrificesCount}
                    actionLink={{
                        text: "Tümünü göster",
                        href: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
                    }}
                />
                <StatCardWithProgress
                    title="Alınan Hisseler"
                    value={stats.emptyShares}
                    maxValue={stats.totalShares}
                    displayValue={stats.filledShares}
                />
                <StatCardWithProgress
                    title="Toplanan Tutar"
                    value={stats.paidAmount}
                    maxValue={stats.totalAmount}
                    displayValue={stats.paidAmount}
                    actionLink={{
                        text: "Tümünü göster",
                        href: "/kurban-admin/hissedarlar/tum-hissedarlar",
                    }}
                    format="currency"
                />
                <StatCardWithProgress
                    title="Kapora Ödeyen Hissedarlar"
                    value={stats.totalShareholders - stats.remainingDeposits}
                    maxValue={stats.totalShareholders}
                    actionLink={{
                        text: "Tümünü göster",
                        href: "/kurban-admin/hissedarlar/tum-hissedarlar",
                    }}
                />
                <StatCardWithProgress
                    title="Tamamlanmamış Ödemeler"
                    value={stats.shareholdersWithIncompletePayments}
                    maxValue={stats.totalShareholders}
                    displayValue={stats.shareholdersWithCompletePayments}
                    actionLink={{
                        text: "Tümünü göster",
                        href: "/kurban-admin/hissedarlar/tum-hissedarlar",
                    }}
                />
            </div>

        </div>
    );
} 
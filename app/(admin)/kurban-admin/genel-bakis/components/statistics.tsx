import React, { useState, useEffect } from 'react';
import { Users, Wallet, UserMinus, AlertCircle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { CustomStatistics } from '@/components/custom-components/custom-statistics';
import { Card } from '@/components/ui/card';

interface DashboardStats {
  totalShareholders: number;
  totalSacrifices: number;
  totalShares: number;
  emptyShares: number;
  missingDeposits: number;
  missingPayments: number;
}

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalShareholders: 0,
    totalSacrifices: 0,
    totalShares: 0,
    emptyShares: 0,
    missingDeposits: 0,
    missingPayments: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("*");

      const { data: sacrifices } = await supabase
        .from("sacrifice_animals")
        .select("*");

      if (shareholders && sacrifices) {
        // Calculate missing deposits (less than 2000 TL paid within 3 days of purchase)
        const missingDeposits = shareholders.filter(shareholder => {
          const purchaseDate = new Date(shareholder.purchase_time);
          const threeDaysAfterPurchase = new Date(purchaseDate.getTime() + (3 * 24 * 60 * 60 * 1000));
          return shareholder.paid_amount < 2000 && new Date() > threeDaysAfterPurchase;
        }).length;

        // Calculate missing payments (any remaining payment)
        const missingPayments = shareholders.filter(shareholder => 
          shareholder.remaining_payment > 0
        ).length;

        setStats({
          totalShareholders: shareholders.length,
          totalSacrifices: sacrifices.length,
          totalShares: shareholders.length,
          emptyShares: sacrifices.reduce((acc, sacrifice) => acc + sacrifice.empty_share, 0),
          missingDeposits,
          missingPayments,
        });
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border shadow-none">
        <CustomStatistics
          title="Toplam Hissedar"
          value={stats.totalShareholders}
          description="Sistemdeki toplam hissedar sayısı"
          icon={Users}
        />
      </Card>
      <Card className="border shadow-none">
        <CustomStatistics
          title="Toplam Kurbanlık"
          value={stats.totalSacrifices}
          description="Sistemdeki toplam kurbanlık sayısı"
          icon={Wallet}
        />
      </Card>
      <Card className="border shadow-none">
        <CustomStatistics
          title="Boş Hisse"
          value={stats.emptyShares}
          description="Satın alınmamış hisse sayısı"
          icon={UserMinus}
        />
      </Card>
      <Card className="border shadow-none">
        <CustomStatistics
          title="Eksik Kapora"
          value={stats.missingDeposits}
          description="3 gün içinde kapora ödemesi yapmayanlar"
          icon={AlertCircle}
          type="warning"
        />
      </Card>
      <Card className="border shadow-none">
        <CustomStatistics
          title="Eksik Ücretler"
          value={stats.missingPayments}
          description="Tüm ödemesi tamamlanmayanlar"
          icon={AlertCircle}
          type="warning"
        />
      </Card>
    </div>
  );
};

export default Statistics; 
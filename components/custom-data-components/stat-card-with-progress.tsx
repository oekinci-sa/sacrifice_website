"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Clock, Edit, LucideIcon, Plus, Trash } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  maxValue?: number;
  suffix?: string;
  displayValue?: number;
  actionLink?: {
    text: string;
    href: string;
  };
  description?: string;
  icon?: LucideIcon;
  type?: "default" | "warning";
  format?: "currency" | "number";
}

// Add new interface for ShareholderStats
interface ShareholderStats {
  missingDeposits: number;
  missingPayments: number;
  consentStats: {
    verildi: number;
    bekliyor: number;
  };
  totalShareholders: number;
}

// Add new interface for recent activity
interface RecentActivity {
  event_id: string;
  changed_at: string;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  column_name: string;
  old_value: string;
  new_value: string;
}

// Add new interface for the enhanced component props
interface EnhancedStatCardProps {
  stats: ShareholderStats;
  recentActivities: RecentActivity[];
}

function StatCard({
  title,
  value,
  maxValue,
  suffix = "",
  displayValue,
  actionLink,
  description,
  icon: Icon,
  type = "default",
  format = "number"
}: StatCardProps) {
  // Helper function to format numbers as currency
  const formatValue = (val: number): string => {
    if (format === "currency") {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0
      }).format(val);
    }
    return val.toLocaleString("tr-TR") + suffix;
  };

  // If maxValue is not provided, just show the value without progress bar
  if (!maxValue) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={`rounded-lg p-2 ${type === "warning"
              ? "bg-[#FCEFEF] text-[#D22D2D]"
              : "bg-[#F0FBF1] text-[#39C645]"
              }`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold">
              {formatValue(value)}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((value / maxValue) * 100);
  const displayPercentage = displayValue ? Math.round((displayValue / maxValue) * 100) : percentage;
  const remaining = maxValue - (displayValue || value);

  // Get progress colors based on percentage
  const getProgressColors = (percentage: number) => {
    if (percentage < 25) {
      return {
        progressColor: "#D22D2D",
        progressBgColor: "#FCEFEF",
      };
    } else if (percentage < 75) {
      return {
        progressColor: "#F9BC06",
        progressBgColor: "#FFFAEC",
      };
    } else {
      return {
        progressColor: "#39C645",
        progressBgColor: "#F0FBF1",
      };
    }
  };

  const { progressColor, progressBgColor } = getProgressColors(displayPercentage);

  return (
    <div className="space-y-4 p-4 border rounded-md">
      {/* Title and "Tümünü Göster" button at the top */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {actionLink && (
          <Link
            href={actionLink.href}
            className="text-sm text-muted-foreground hover:underline"
          >
            {actionLink.text}
          </Link>
        )}
      </div>

      {/* "... / ... (Kalan: ...)" format in the middle - left aligned */}
      <div className="text-left">
        <div className="text-xl font-bold">
          {formatValue(displayValue || value)}
          <span className="text-sm font-normal text-muted-foreground">
            {" / "}{formatValue(maxValue)}
            {" "}
            <span className="text-sm">(Kalan: {formatValue(remaining)})</span>
          </span>
        </div>
      </div>

      {/* Progress bar + percentage at the bottom */}
      <div className="flex items-center gap-4">
        <Progress
          value={displayPercentage}
          className={`h-2 flex-1 transition-all`}
          style={{
            '--progress-background': progressBgColor,
            '--progress-foreground': progressColor,
            background: 'var(--progress-background)',
          } as React.CSSProperties}
        />
        <span className="text-sm font-medium text-muted-foreground">
          %{displayPercentage}
        </span>
      </div>
    </div>
  );
}

// Enhanced version of the component for the shareholders page
function EnhancedStatCard({ stats, recentActivities }: EnhancedStatCardProps) {
  // Get change type icon
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case "Ekleme":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "Güncelleme":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "Silme":
        return <Trash className="h-4 w-4 text-red-500" />;
      default:
        return <Edit className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yy HH:mm");
    } catch {
      // Return the original string if date parsing fails
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Missing Deposits Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Kapora Bekleyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.missingDeposits}</div>
          <Progress
            value={(stats.missingDeposits / stats.totalShareholders) * 100}
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Toplam {stats.totalShareholders} hissedardan {stats.missingDeposits} tanesi kapora bekleniyor.
          </p>
        </CardContent>
      </Card>

      {/* Missing Payments Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tüm Ödeme Bekleyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.missingPayments}</div>
          <Progress
            value={(stats.missingPayments / stats.totalShareholders) * 100}
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Toplam {stats.totalShareholders} hissedardan {stats.missingPayments} tanesi tüm ödeme bekleniyor.
          </p>
        </CardContent>
      </Card>

      {/* Consent Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Vekalet Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.consentStats.verildi}</div>
              <p className="text-xs text-muted-foreground">Vekalet Verildi</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.consentStats.bekliyor}</div>
              <p className="text-xs text-muted-foreground">Vekalet Bekliyor</p>
            </div>
          </div>
          <Progress
            value={(stats.consentStats.verildi / stats.totalShareholders) * 100}
            className="h-2 mt-2 bg-red-100"
            style={{
              '--progress-foreground': '#39C645', // green-600 color
            } as React.CSSProperties}
          />
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card className="md:col-span-1 lg:row-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <div className="space-y-4">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.event_id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getChangeTypeIcon(activity.change_type)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.description}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDate(activity.changed_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export both components with a compatibility check
export function StatCardWithProgress(props: StatCardProps | EnhancedStatCardProps) {
  // Check if the props match the EnhancedStatCardProps interface
  if ('stats' in props && 'recentActivities' in props) {
    return <EnhancedStatCard {...props as EnhancedStatCardProps} />;
  }
  // Otherwise, treat as the original StatCardProps
  return <StatCard {...props as StatCardProps} />;
} 
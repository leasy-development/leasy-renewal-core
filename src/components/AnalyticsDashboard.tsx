import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Home, Calendar, Users } from "lucide-react";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    revenueChange: number;
    activeProperties: number;
    propertyChange: number;
    totalBookings: number;
    bookingChange: number;
    occupancyRate: number;
    occupancyChange: number;
  };
}

// Mock data generator
const generateMockData = (): AnalyticsData => {
  return {
    summary: {
      totalRevenue: 24850,
      revenueChange: 15.3,
      activeProperties: 12,
      propertyChange: 2.1,
      totalBookings: 189,
      bookingChange: 8.7,
      occupancyRate: 78.5,
      occupancyChange: -2.3
    }
  };
};

const fetchAnalytics = async (): Promise<AnalyticsData> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockData();
};

const AnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `€${val.toLocaleString()}`;
        case 'percentage':
          return `${val}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(change)}% from last month
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={analytics.summary.totalRevenue}
          change={analytics.summary.revenueChange}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Active Properties"
          value={analytics.summary.activeProperties}
          change={analytics.summary.propertyChange}
          icon={Home}
        />
        <MetricCard
          title="Total Bookings"
          value={analytics.summary.totalBookings}
          change={analytics.summary.bookingChange}
          icon={Calendar}
        />
        <MetricCard
          title="Occupancy Rate"
          value={analytics.summary.occupancyRate}
          change={analytics.summary.occupancyChange}
          icon={Users}
          format="percentage"
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
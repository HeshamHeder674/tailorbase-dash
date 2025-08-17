import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, Users, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total orders and revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_price, status');

      // Get total customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id');

      if (orders) {
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalCustomers: customers?.length || 0,
          pendingOrders,
          completedOrders,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statsCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toLocaleString()} ريال`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'عدد العملاء',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'طلبات قيد التنفيذ',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'طلبات مكتملة',
      value: stats.completedOrders,
      icon: Package,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          مرحباً بك في لوحة التحكم الخاصة بـ BerryBelle
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
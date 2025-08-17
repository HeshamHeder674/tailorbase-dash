import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_pieces: number;
  total_price: number;
  status: string;
  created_at: string;
  tax_amount: number;
  images: string[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      completed: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
        <p className="text-muted-foreground">
          إدارة جميع الطلبات والمبيعات
        </p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  طلب #{order.order_number}
                </CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم العميل</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد القطع</p>
                  <p className="font-medium">{order.total_pieces}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السعر الإجمالي</p>
                  <p className="font-medium">{Number(order.total_price).toLocaleString()} ريال</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {orders.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">لا توجد طلبات حالياً</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
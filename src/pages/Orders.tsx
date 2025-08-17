import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Edit, Plus } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
          <p className="text-muted-foreground">
            إدارة جميع الطلبات والمبيعات
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/orders/new')}>
          <Plus className="h-4 w-4 ml-2" />
          طلب جديد
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>عدد القطع</TableHead>
              <TableHead>السعر الإجمالي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  #{order.order_number}
                </TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.customer_phone}</TableCell>
                <TableCell>{order.total_pieces}</TableCell>
                <TableCell>{Number(order.total_price).toLocaleString()} ريال</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString('ar-SA')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {orders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لا توجد طلبات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
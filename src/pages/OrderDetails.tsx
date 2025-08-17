import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_pieces: number;
  total_price: number;
  fabric_price: number;
  extra_costs: number;
  tailoring_price: number;
  tax_amount: number;
  status: string;
  notes: string;
  images: string[];
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  model: string;
  size: string;
  quantity: number;
  meters: number;
  unit_price: number;
  total_price: number;
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      setOrder({
        ...orderData,
        order_items: itemsData || [],
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
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

  if (!order) {
    return <div className="text-center">لم يتم العثور على الطلب</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للطلبات
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            تفاصيل الطلب #{order.order_number}
          </h1>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">الاسم:</span>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">رقم الهاتف:</span>
              <p className="font-medium">{order.customer_phone}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">تاريخ الطلب:</span>
              <p className="font-medium">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملخص الطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>سعر القماش:</span>
              <span>{Number(order.fabric_price).toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between">
              <span>سعر التفصيل:</span>
              <span>{Number(order.tailoring_price).toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between">
              <span>مصاريف إضافية:</span>
              <span>{Number(order.extra_costs).toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between">
              <span>الضريبة:</span>
              <span>{Number(order.tax_amount).toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>الإجمالي:</span>
              <span>{Number(order.total_price).toLocaleString()} ريال</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">المنتج:</span>
                    <p className="font-medium">{item.product_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">الموديل:</span>
                    <p className="font-medium">{item.model || 'غير محدد'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">المقاس:</span>
                    <p className="font-medium">{item.size || 'غير محدد'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">الكمية:</span>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                </div>
                {item.meters && (
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">عدد الأمتار:</span>
                    <p className="font-medium">{item.meters}</p>
                  </div>
                )}
                <div className="mt-2 flex justify-between">
                  <span>سعر الوحدة: {Number(item.unit_price).toLocaleString()} ريال</span>
                  <span className="font-bold">الإجمالي: {Number(item.total_price).toLocaleString()} ريال</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
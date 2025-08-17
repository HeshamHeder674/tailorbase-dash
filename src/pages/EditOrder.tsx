import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const orderSchema = z.object({
  customer_name: z.string().min(1, 'اسم العميل مطلوب'),
  customer_phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  status: z.enum(['pending', 'completed', 'cancelled']),
  fabric_price: z.number().min(0).default(0),
  tailoring_price: z.number().min(0).default(0),
  extra_costs: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  order_items: z.array(z.object({
    id: z.string().optional(),
    product_name: z.string().min(1, 'اسم المنتج مطلوب'),
    model: z.string().optional(),
    size: z.string().optional(),
    quantity: z.number().min(1, 'الكمية مطلوبة'),
    meters: z.number().optional(),
    unit_price: z.number().min(0, 'السعر مطلوب'),
  })),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      status: 'pending',
      fabric_price: 0,
      tailoring_price: 0,
      extra_costs: 0,
      tax_amount: 0,
      notes: '',
      order_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'order_items',
  });

  const watchedItems = form.watch('order_items');
  const watchedPrices = form.watch(['fabric_price', 'tailoring_price', 'extra_costs', 'tax_amount']);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
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

      form.reset({
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        status: orderData.status as 'pending' | 'completed' | 'cancelled',
        fabric_price: Number(orderData.fabric_price) || 0,
        tailoring_price: Number(orderData.tailoring_price) || 0,
        extra_costs: Number(orderData.extra_costs) || 0,
        tax_amount: Number(orderData.tax_amount) || 0,
        notes: orderData.notes || '',
        order_items: itemsData.map(item => ({
          id: item.id,
          product_name: item.product_name,
          model: item.model || '',
          size: item.size || '',
          quantity: item.quantity,
          meters: Number(item.meters) || 0,
          unit_price: Number(item.unit_price),
        })),
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تحميل الطلب',
        description: 'حدث خطأ أثناء تحميل بيانات الطلب.',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  // Calculate totals
  const itemsTotal = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  const totalPieces = watchedItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = itemsTotal + 
    (watchedPrices[0] || 0) + 
    (watchedPrices[1] || 0) + 
    (watchedPrices[2] || 0) + 
    (watchedPrices[3] || 0);

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    try {
      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          status: data.status,
          total_pieces: totalPieces,
          total_price: totalPrice,
          fabric_price: data.fabric_price,
          tailoring_price: data.tailoring_price,
          extra_costs: data.extra_costs,
          tax_amount: data.tax_amount,
          notes: data.notes,
        })
        .eq('id', id);

      if (orderError) throw orderError;

      // Delete existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

      if (deleteError) throw deleteError;

      // Insert updated order items
      const orderItems = data.order_items.map(item => ({
        order_id: id,
        product_name: item.product_name,
        model: item.model,
        size: item.size,
        quantity: item.quantity,
        meters: item.meters,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'تم تحديث الطلب بنجاح',
        description: 'تم حفظ التغييرات بنجاح.',
      });

      navigate('/dashboard/orders');
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تحديث الطلب',
        description: 'حدث خطأ أثناء تحديث الطلب. حاول مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-center">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/orders')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة للطلبات
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">تعديل الطلب</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>معلومات العميل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العميل</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة الطلب</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">قيد التنفيذ</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التكاليف الإضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fabric_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر القماش</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tailoring_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر التفصيل</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extra_costs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مصاريف إضافية</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الضريبة</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>المنتجات</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({
                    product_name: '',
                    model: '',
                    size: '',
                    quantity: 1,
                    meters: 0,
                    unit_price: 0,
                  })}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منتج
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">منتج {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`order_items.${index}.product_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المنتج</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`order_items.${index}.model`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموديل</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`order_items.${index}.size`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المقاس</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`order_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكمية</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`order_items.${index}.meters`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد الأمتار</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`order_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سعر الوحدة</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      إجمالي هذا المنتج: {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toLocaleString()} ريال
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ملاحظات إضافية</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>إجمالي القطع:</span>
                  <span>{totalPieces}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي المنتجات:</span>
                  <span>{itemsTotal.toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span>سعر القماش:</span>
                  <span>{(watchedPrices[0] || 0).toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span>سعر التفصيل:</span>
                  <span>{(watchedPrices[1] || 0).toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span>مصاريف إضافية:</span>
                  <span>{(watchedPrices[2] || 0).toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span>{(watchedPrices[3] || 0).toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>الإجمالي النهائي:</span>
                  <span>{totalPrice.toLocaleString()} ريال</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/orders')}>
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
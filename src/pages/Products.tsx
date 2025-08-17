import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  model: string;
  description: string;
  price: number;
  fabric_price: number;
  tailoring_price: number;
  sizes: string[];
  images: string[];
  is_active: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">المنتجات</h1>
        <p className="text-muted-foreground">
          إدارة جميع المنتجات والخدمات
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">موديل: {product.model}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && (
                <p className="text-sm">{product.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">السعر الأساسي:</span>
                  <span className="font-medium">{Number(product.price).toLocaleString()} ريال</span>
                </div>
                
                {product.fabric_price && (
                  <div className="flex justify-between">
                    <span className="text-sm">سعر القماش:</span>
                    <span className="font-medium">{Number(product.fabric_price).toLocaleString()} ريال</span>
                  </div>
                )}
                
                {product.tailoring_price && (
                  <div className="flex justify-between">
                    <span className="text-sm">سعر التفصيل:</span>
                    <span className="font-medium">{Number(product.tailoring_price).toLocaleString()} ريال</span>
                  </div>
                )}
              </div>

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">المقاسات المتاحة:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.sizes.map((size, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {products.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">لا توجد منتجات حالياً</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { productService, salesService } from '@/lib/supabase-services';
import type { Sale, Product } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const saleSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function SalesPage() {
  const { user, addAuditLog } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [rowSaving, setRowSaving] = useState(false);

  const newIntl = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, salesData] = await Promise.all([
          productService.getProducts(),
          salesService.getSales()
        ]);
        setProducts(productsData);
        setSales(salesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los datos.',
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredSales = sales.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const dateStr = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(s.date));
    return (
      s.productName.toLowerCase().includes(q) ||
      String(s.total).includes(q) ||
      dateStr.includes(q)
    );
  });

  const onSubmit = async (data: SaleFormValues) => {
    setIsLoading(true);
    const product = products.find(p => p.id === data.productId);
    if (!product || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Producto seleccionado no encontrado o usuario no ha iniciado sesión.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: data.quantity,
        total: product.price * data.quantity,
        recordedBy: user.id,
        date: new Date(),
      };
      console.log('Creating sale with payload:', payload);

      const newSale = await salesService.createSale(payload);

      setSales(prev => [newSale, ...prev]);
      addAuditLog('Venta Registrada', `Venta de ${data.quantity}x ${product.name} por ${newIntl.format(newSale.total)}`);
      
      toast({
        title: 'Venta registrada',
        description: `Se ha registrado la venta de ${data.quantity}x ${product.name}`,
      });

      form.reset();
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || error?.error_description || 'No se pudo registrar la venta.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (s: Sale) => {
    setEditingId(s.id);
    setEditQuantity(String(s.quantity));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuantity('');
    setRowSaving(false);
  };

  const saveEdit = async (s: Sale) => {
    if (!editingId) return;
    setRowSaving(true);
    try {
      const newQty = Math.max(1, Number(editQuantity) || s.quantity);
      const unitPrice = s.unitPrice; // mantener precio unitario original
      const updated = await salesService.updateSale(editingId, {
        quantity: newQty,
        total: unitPrice * newQty,
      } as any);
      setSales(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast({ title: 'Actualizado', description: 'Venta actualizada.' });
      cancelEdit();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar la venta.' });
      setRowSaving(false);
    }
  };

  const deleteSaleRow = async (id: string) => {
    const item = sales.find(x => x.id === id);
    if (!item) return;
    try {
      await salesService.deleteSale(id);
      setSales(prev => prev.filter(x => x.id !== id));
      toast({ title: 'Eliminado', description: 'Venta eliminada.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo eliminar la venta.' });
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <>
      <PageHeader title="Registrar una Venta" description="Selecciona un producto y cantidad para registrar una nueva venta." />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {newIntl.format(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Registrar Venta
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventas de Hoy</CardTitle>
              <CardDescription>Una lista de las ventas registradas hoy.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Buscar por producto, monto o fecha..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {/* Tabla visible en md+ */}
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead className="w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map(sale => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.productName}</TableCell>
                        <TableCell>
                          {editingId === sale.id ? (
                            <Input type="number" min="1" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="h-8 w-24" />
                          ) : (
                            sale.quantity
                          )}
                        </TableCell>
                        <TableCell>{newIntl.format(sale.total)}</TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(sale.date))}
                        </TableCell>
                        <TableCell>
                          {editingId === sale.id ? (
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" disabled={rowSaving} title="Guardar">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Guardar cambios</AlertDialogTitle>
                                    <AlertDialogDescription>¿Confirmas guardar los cambios de la venta?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => saveEdit(sale)}>Guardar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancelar">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => startEdit(sale)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-destructive" title="Eliminar">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
                                    <AlertDialogDescription>¿Seguro que deseas eliminar la venta de {sale.productName}? Esta acción no se puede deshacer.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteSaleRow(sale.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {query ? 'No hay resultados para tu búsqueda.' : 'No hay ventas registradas aún.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>

              {/* Cards en móvil */}
              <div className="grid gap-3 md:hidden">
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <div key={sale.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{sale.productName}</p>
                          <p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(sale.date))}</p>
                        </div>
                        <div className="font-semibold">{newIntl.format(sale.total)}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div>
                          Cantidad: {editingId === sale.id ? (
                            <Input type="number" min="1" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="h-8 w-20 inline-block ml-2" />
                          ) : (
                            <span className="ml-1">{sale.quantity}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {editingId === sale.id ? (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" disabled={rowSaving} title="Guardar">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Guardar cambios</AlertDialogTitle>
                                    <AlertDialogDescription>¿Confirmas guardar los cambios de la venta?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => saveEdit(sale)}>Guardar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancelar">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => startEdit(sale)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-destructive" title="Eliminar">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
                                    <AlertDialogDescription>¿Seguro que deseas eliminar la venta de {sale.productName}? Esta acción no se puede deshacer.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteSaleRow(sale.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">{query ? 'No hay resultados para tu búsqueda.' : 'No hay ventas registradas aún.'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

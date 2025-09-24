'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { ExpenseCategory, DistributionType, Product } from '@/lib/types';
import { distributionTypeService, productService, expenseCategoryService } from '@/lib/supabase-services';
import { Loader2, Trash2, Pencil, Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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

export default function AttributesPage() {
  const { toast } = useToast();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [catIsLoading, setCatIsLoading] = useState(false);
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catEditingName, setCatEditingName] = useState('');

  const [distTypes, setDistTypes] = useState<DistributionType[]>([]);
  const [distName, setDistName] = useState('Socios');
  const [distLoading, setDistLoading] = useState(false);
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set());
  const [distEditingId, setDistEditingId] = useState<string | null>(null);
  const [distEditingName, setDistEditingName] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<string>('');
  const [prodLoading, setProdLoading] = useState(false);
  const [prodEditingId, setProdEditingId] = useState<string | null>(null);
  const [prodEditingName, setProdEditingName] = useState('');
  const [prodEditingPrice, setProdEditingPrice] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, dt, pd] = await Promise.all([
          expenseCategoryService.getExpenseCategories().catch(() => []),
          distributionTypeService.getDistributionTypes().catch(() => []),
          productService.getProducts().catch(() => [])
        ]);
        setCategories(cats);
        setDistTypes(dt);
        setProducts(pd);
        // cargar selección activa desde localStorage
        try {
          const saved = localStorage.getItem('dist_active_type_ids');
          if (saved) {
            const arr: string[] = JSON.parse(saved);
            setActiveSet(new Set(arr));
          } else {
            // si no hay, por defecto marcar todos existentes
            setActiveSet(new Set(dt.map((x) => x.id)));
          }
        } catch {}
      } catch {}
    };
    load();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() === '') return;
    setCatIsLoading(true);
    try {
      const created = await expenseCategoryService.createExpenseCategory({ name: newCategory.trim() });
      setCategories((prev) => [...prev, created]);
      setNewCategory('');
      toast({ title: 'Éxito', description: `Categoría "${created.name}" agregada.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo agregar la categoría.' });
    } finally {
      setCatIsLoading(false);
    }
  };

  const startEditCategory = (cat: ExpenseCategory) => {
    setCatEditingId(cat.id);
    setCatEditingName(cat.name);
  };

  const cancelEditCategory = () => {
    setCatEditingId(null);
    setCatEditingName('');
  };

  const saveEditCategory = async () => {
    if (!catEditingId) return;
    try {
      const updated = await expenseCategoryService.updateExpenseCategory(catEditingId, { name: catEditingName });
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast({ title: 'Actualizado', description: `Categoría renombrada a "${updated.name}".` });
      cancelEditCategory();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar la categoría.' });
    }
  };

  const deleteCategory = async (id: string) => {
    const item = categories.find(c => c.id === id);
    if (!item) return;
    try {
      await expenseCategoryService.deleteExpenseCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Eliminado', description: `Se eliminó "${item.name}".` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo eliminar la categoría.' });
    }
  };

  const handleAddDistributionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distName.trim()) return;
    setDistLoading(true);
    try {
      // crear con porcentaje 0 por defecto; la calculadora define los porcentajes dinámicamente
      const created = await distributionTypeService.createDistributionType({ name: distName.trim(), percentage: 0 });
      setDistTypes((prev) => [...prev, created]);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('dist-types-updated'));
      // activar por defecto el nuevo tipo
      setActiveSet((prev) => {
        const next = new Set(prev);
        next.add(created.id);
        try { localStorage.setItem('dist_active_type_ids', JSON.stringify(Array.from(next))); } catch {}
        return next;
      });
      setDistName('');
      toast({ title: 'Éxito', description: 'Tipo de distribución agregado.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo agregar el tipo.' });
    } finally {
      setDistLoading(false);
    }
  };

  const handleDeleteDistributionType = async (id: string) => {
    const item = distTypes.find(d => d.id === id);
    if (!item) return;
    try {
      await distributionTypeService.deleteDistributionType(id);
      setDistTypes(prev => prev.filter(d => d.id !== id));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('dist-types-updated'));
      toast({ title: 'Eliminado', description: `Se eliminó "${item.name}".` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo eliminar el tipo.' });
    }
  };

  const startEditDist = (d: DistributionType) => {
    setDistEditingId(d.id);
    setDistEditingName(d.name);
  };

  const cancelEditDist = () => {
    setDistEditingId(null);
    setDistEditingName('');
  };

  const saveEditDist = async () => {
    if (!distEditingId) return;
    try {
      const updated = await distributionTypeService.updateDistributionType(distEditingId, { name: distEditingName });
      setDistTypes(prev => prev.map(x => x.id === updated.id ? updated : x));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('dist-types-updated'));
      toast({ title: 'Actualizado', description: `Tipo renombrado a "${updated.name}".` });
      cancelEditDist();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar el tipo.' });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || prodPrice.trim() === '') return;
    setProdLoading(true);
    try {
      const created = await productService.createProduct({ name: prodName.trim(), price: Number(prodPrice) });
      setProducts((prev) => [...prev, created]);
      setProdName('');
      setProdPrice('');
      toast({ title: 'Éxito', description: 'Producto agregado.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo agregar el producto.' });
    } finally {
      setProdLoading(false);
    }
  };

  const startEditProduct = (p: Product) => {
    setProdEditingId(p.id);
    setProdEditingName(p.name);
    setProdEditingPrice(String(p.price));
  };

  const cancelEditProduct = () => {
    setProdEditingId(null);
    setProdEditingName('');
    setProdEditingPrice('');
  };

  const saveEditProduct = async () => {
    if (!prodEditingId) return;
    try {
      const updated = await productService.updateProduct(prodEditingId, { name: prodEditingName, price: Number(prodEditingPrice) });
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast({ title: 'Actualizado', description: `Producto actualizado.` });
      cancelEditProduct();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar el producto.' });
    }
  };

  const deleteProduct = async (id: string) => {
    const item = products.find(p => p.id === id);
    if (!item) return;
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Eliminado', description: `Se eliminó "${item.name}".` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo eliminar el producto.' });
    }
  };

  const toggleActive = (id: string, value: boolean) => {
    setActiveSet((prev) => {
      const next = new Set(prev);
      if (value) next.add(id); else next.delete(id);
      try { localStorage.setItem('dist_active_type_ids', JSON.stringify(Array.from(next))); } catch {}
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('dist-types-updated'));
      return next;
    });
  };

  return (
    <>
      <PageHeader title="Atributos" description="Gestiona Tipos de Distribución, Productos y Categorías de Gastos." />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Gastos</CardTitle>
              <CardDescription>Gestiona tus categorías de gastos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="flex items-end gap-2 mb-4">
                <div className="flex-grow">
                  <label htmlFor="newCategory" className="text-sm font-medium">Nombre de Nueva Categoría</label>
                  <Input id="newCategory" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g., Marketing" />
                </div>
                <Button type="submit" disabled={catIsLoading}>
                  {catIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Agregar
                </Button>
              </form>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between rounded-md bg-secondary p-2 px-3 text-sm">
                    {catEditingId === cat.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input value={catEditingName} onChange={(e) => setCatEditingName(e.target.value)} className="h-8" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Guardar">
                              <Check className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Guardar cambios</AlertDialogTitle>
                              <AlertDialogDescription>¿Confirmas guardar los cambios de la categoría?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={saveEditCategory}>Guardar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button size="icon" variant="ghost" onClick={cancelEditCategory} title="Cancelar">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEditCategory(cat)} title="Editar">
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
                                <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                                <AlertDialogDescription>¿Seguro que deseas eliminar "{cat.name}"? Esta acción no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCategory(cat.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Distribución</CardTitle>
              <CardDescription>Gestiona los nombres de los tipos y elige cuáles se muestran en la calculadora.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDistributionType} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <Input value={distName} onChange={(e) => setDistName(e.target.value)} placeholder="Socios" />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <Button type="submit" disabled={distLoading} className="w-full">
                    {distLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Agregar
                  </Button>
                </div>
              </form>
              <ul className="space-y-2">
                {distTypes.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-md bg-secondary p-2 px-3 text-sm">
                    {distEditingId === d.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input value={distEditingName} onChange={(e) => setDistEditingName(e.target.value)} className="h-8" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Guardar">
                              <Check className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Guardar cambios</AlertDialogTitle>
                              <AlertDialogDescription>¿Confirmas guardar los cambios del tipo de distribución?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={saveEditDist}>Guardar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button size="icon" variant="ghost" onClick={cancelEditDist} title="Cancelar">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{d.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Mostrar en calculadora</span>
                            <Switch checked={activeSet.has(d.id)} onCheckedChange={(v) => toggleActive(d.id, v)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEditDist(d)} title="Editar">
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
                                <AlertDialogTitle>Eliminar tipo</AlertDialogTitle>
                                <AlertDialogDescription>¿Seguro que deseas eliminar "{d.name}"? Esta acción no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDistributionType(d.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Agrega productos disponibles para ventas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <div className="sm:col-span-1">
                <label className="text-sm font-medium">Nombre</label>
                <Input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Hamburguesa" />
              </div>
              <div className="sm:col-span-1">
                <label className="text-sm font-medium">Precio (S/.)</label>
                <Input type="number" step="0.01" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <Button type="submit" disabled={prodLoading} className="w-full">
                  {prodLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Agregar
                </Button>
              </div>
            </form>
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md bg-secondary p-2 px-3 text-sm">
                  {prodEditingId === p.id ? (
                    <div className="grid grid-cols-5 gap-2 w-full items-center">
                      <Input className="h-8 col-span-2" value={prodEditingName} onChange={(e) => setProdEditingName(e.target.value)} />
                      <Input className="h-8 col-span-1" type="number" step="0.01" value={prodEditingPrice} onChange={(e) => setProdEditingPrice(e.target.value)} />
                      <div className="col-span-2 flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Guardar">
                              <Check className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Guardar cambios</AlertDialogTitle>
                              <AlertDialogDescription>¿Confirmas guardar los cambios del producto?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={saveEditProduct}>Guardar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button size="icon" variant="ghost" onClick={cancelEditProduct} title="Cancelar">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span>{p.name}</span>
                        <span className="font-semibold">S/. {p.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => startEditProduct(p)} title="Editar">
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
                              <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
                              <AlertDialogDescription>¿Seguro que deseas eliminar "{p.name}"? Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProduct(p.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

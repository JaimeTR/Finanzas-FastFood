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
import { expensesService, expenseCategoryService } from '@/lib/supabase-services';
import type { Expense, ExpenseCategory } from '@/lib/types';
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
import Link from 'next/link';

const expenseSchema = z.object({
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [rowSaving, setRowSaving] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const newIntl = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      categoryId: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [expensesData, categoriesData] = await Promise.all([
          expensesService.getExpenses(),
          expenseCategoryService.getExpenseCategories(),
        ]);
        setExpenses(expensesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading expenses/categories:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar gastos o categorías.',
        });
      } finally {
        setIsLoadingData(false);
        setLoadingCategories(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredExpenses = expenses.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      e.description.toLowerCase().includes(q) ||
      (e.categoryName || '').toLowerCase().includes(q) ||
      String(e.amount).includes(q)
    );
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Usuario no ha iniciado sesión.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedCat = categories.find(c => c.id === data.categoryId);
      if (!selectedCat) {
        throw new Error('Categoría inválida.');
      }
      const newExpense = await expensesService.createExpense({
        description: data.description,
        amount: data.amount,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        recordedBy: user.id,
        date: new Date(),
        notes: undefined,
      } as any);

      console.log('Gasto creado (respuesta Supabase):', newExpense);
      // Refrescar desde DB para confirmar persistencia
      const refreshed = await expensesService.getExpenses();
      setExpenses(refreshed);
      toast({
        title: 'Gasto Registrado',
        description: `${data.description} por ${newIntl.format(data.amount)}`,
      });
      form.reset();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || error?.error_description || 'No se pudo registrar el gasto.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (e: Expense) => {
    setEditingId(e.id);
    setEditDescription(e.description);
    setEditAmount(String(e.amount));
    setEditCategoryId(e.categoryId || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
    setEditAmount('');
    setEditCategoryId('');
    setRowSaving(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setRowSaving(true);
    try {
      const selectedCat = categories.find(c => c.id === editCategoryId);
      const nextCategoryName = selectedCat ? selectedCat.name : undefined;
      const updated = await expensesService.updateExpense(editingId, {
        description: editDescription,
        amount: Number(editAmount),
        categoryId: editCategoryId || undefined as any,
        categoryName: nextCategoryName,
      } as any);
      setExpenses(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast({ title: 'Actualizado', description: 'Gasto actualizado correctamente.' });
      cancelEdit();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar el gasto.' });
      setRowSaving(false);
    }
  };

  const deleteExpenseRow = async (id: string) => {
    const item = expenses.find(x => x.id === id);
    if (!item) return;
    try {
      await expensesService.deleteExpense(id);
      setExpenses(prev => prev.filter(x => x.id !== id));
      toast({ title: 'Eliminado', description: 'Gasto eliminado.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo eliminar el gasto.' });
    }
  };
  
  return (
    <>
      <PageHeader title="Registrar un Gasto" description="Introduce los detalles para registrar un nuevo gasto del negocio." />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="ej., Suministros de oficina" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/.</span>
                            <Input type="number" step="0.01" placeholder="0.00" className="pl-8" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={loadingCategories || categories.length === 0}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.length > 0 && categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {categories.length === 0 && !loadingCategories && (
                          <p className="mt-1 text-xs text-muted-foreground">No hay categorías. Crea nuevas en Atributos.</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">Administra tus categorías en <Link href="/attributes" className="underline">Atributos</Link>.</p>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Registrar Gasto
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Gastos Recientes</CardTitle>
              <CardDescription>Una lista de los gastos registrados más recientemente.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Buscar por descripción, categoría o monto..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {/* Tabla visible en md+ */}
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead className="w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {editingId === expense.id ? (
                            <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-8" />
                          ) : (
                            expense.description
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === expense.id ? (
                            <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            expense.categoryName
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === expense.id ? (
                            <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8" />
                          ) : (
                            newIntl.format(expense.amount)
                          )}
                        </TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(expense.date))}
                        </TableCell>
                        <TableCell>
                          {editingId === expense.id ? (
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
                                    <AlertDialogDescription>¿Confirmas guardar los cambios del gasto?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={saveEdit}>Guardar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancelar">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => startEdit(expense)} title="Editar">
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
                                    <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
                                    <AlertDialogDescription>¿Seguro que deseas eliminar "{expense.description}"? Esta acción no se puede deshacer.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteExpenseRow(expense.id)}>Eliminar</AlertDialogAction>
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
                      <TableCell colSpan={5} className="text-center">
                        {query ? 'No hay resultados para tu búsqueda.' : 'Aún no se han registrado gastos.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>

              {/* Cards en móvil */}
              <div className="grid gap-3 md:hidden">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <div key={expense.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">{expense.categoryName || 'Sin categoría'}</p>
                        </div>
                        <div className="font-semibold">{newIntl.format(expense.amount)}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span>{new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(expense.date))}</span>
                        </div>
                        <div className="flex gap-2">
                          {editingId === expense.id ? (
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
                                    <AlertDialogDescription>¿Confirmas guardar los cambios del gasto?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={saveEdit}>Guardar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancelar">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => startEdit(expense)} title="Editar">
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
                                    <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
                                    <AlertDialogDescription>¿Seguro que deseas eliminar el gasto {expense.description}? Esta acción no se puede deshacer.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteExpenseRow(expense.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                      {editingId === expense.id && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Descripción" className="h-8" />
                          <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="Monto" className="h-8" />
                          <div className="col-span-2">
                            <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">{query ? 'No hay resultados para tu búsqueda.' : 'No hay gastos registrados aún.'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

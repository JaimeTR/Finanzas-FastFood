'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DollarSign, TrendingUp, TrendingDown, Scale, type LucideIcon, Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { salesService, expensesService } from '@/lib/supabase-services';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  subtitle?: string; // p.ej. "Este Mes" | "Desde Inicio"
}

function StatCard({ title, value, icon: Icon, description, subtitle }: StatCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle && (
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 text-muted-foreground">
              {subtitle}
            </Badge>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

interface DashboardData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  profitMargin: number;
  lifetimeRevenue: number;
  lifetimeExpenses: number;
  lifetimeBalance: number;
  chartData: Array<{
    date: string;
    income: number;
    expenses: number;
  }>;
}

function TrendsChart({ data }: { data: DashboardData['chartData'] }) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Ingresos vs. Gastos</CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 text-muted-foreground">Últimos 30 días</Badge>
        </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={{
                    income: { label: "Ingresos", color: "hsl(var(--chart-1))" },
                    expenses: { label: "Gastos", color: "hsl(var(--chart-2))" }
                }} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `S/.${value}`} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Legend />
                            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);

        // Cargar datos del mes actual
        const [monthSales, monthExpenses, dailySales, dailyExpenses, allSales, allExpenses] = await Promise.all([
          salesService.getSalesByDateRange(monthStart, now),
          expensesService.getExpensesByDateRange(monthStart, now),
          salesService.getSalesByDateRange(last30Days, now),
          expensesService.getExpensesByDateRange(last30Days, now),
          salesService.getSales(),
          expensesService.getExpenses()
        ]);

        const monthlyRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
        const monthlyExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const monthlyProfit = monthlyRevenue - monthlyExpenses;
        const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

        // Crear datos para el gráfico
        const chartData = Array.from({ length: 30 }).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          const dayStr = date.toISOString().split('T')[0];
          
          const dayIncome = dailySales
            .filter(sale => new Date(sale.date).toISOString().split('T')[0] === dayStr)
            .reduce((sum, sale) => sum + sale.total, 0);
          
          const dayExpenses = dailyExpenses
            .filter(expense => new Date(expense.date).toISOString().split('T')[0] === dayStr)
            .reduce((sum, expense) => sum + expense.amount, 0);

          return {
            date: new Intl.DateTimeFormat('es-PE', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date),
            income: dayIncome,
            expenses: dayExpenses,
          };
        });

        // Acumulados desde inicio
        const lifetimeRevenue = allSales.reduce((sum, s) => sum + s.total, 0);
        const lifetimeExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
        const lifetimeBalance = lifetimeRevenue - lifetimeExpenses;

        setDashboardData({
          monthlyRevenue,
          monthlyExpenses,
          monthlyProfit,
          profitMargin,
          lifetimeRevenue,
          lifetimeExpenses,
          lifetimeBalance,
          chartData
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los datos del dashboard.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se pudieron cargar los datos del dashboard.</p>
      </div>
    );
  }

  // Beneficio neto del mes actual ya está en dashboardData.monthlyProfit

  return (
    <>
      <PageHeader title={`¡Bienvenido, ${user?.name.split(' ')[0]}!`} description="Aquí tienes un resumen de las finanzas de tu negocio." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Beneficio Neto" 
          subtitle="Este Mes"
          value={formatCurrency(dashboardData.monthlyProfit)} 
          icon={DollarSign} 
          description={`Margen: ${dashboardData.profitMargin.toFixed(1)}%`} 
        />
        <StatCard 
          title="Ingresos" 
          subtitle="Este Mes"
          value={formatCurrency(dashboardData.monthlyRevenue)} 
          icon={TrendingUp} 
          description="Ventas del mes actual" 
        />
        <StatCard 
          title="Gastos" 
          subtitle="Este Mes"
          value={formatCurrency(dashboardData.monthlyExpenses)} 
          icon={TrendingDown} 
          description="Gastos del mes actual" 
        />
        <StatCard 
          title="Balance Total" 
          subtitle="Desde Inicio"
          value={formatCurrency(dashboardData.lifetimeBalance)} 
          icon={Scale} 
          description="Ingresos acumulados - Gastos acumulados" 
        />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8">
        <TrendsChart data={dashboardData.chartData} />
      </div>
    </>
  );
}

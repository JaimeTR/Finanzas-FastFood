'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { AIAdvisor } from '@/components/ai-advisor';
import DistributionCalculator from '@/components/distribution-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Shield, ShoppingCart, Copy, Share2, FileDown } from 'lucide-react';
import { salesService, expensesService } from '@/lib/supabase-services';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdvicePage() {
  const [weeklyData, setWeeklyData] = useState<{
    profit: number;
    sales: number;
    expenses: number;
    salesCount: number;
    topProducts: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generateSignal, setGenerateSignal] = useState(0);
  const { toast } = useToast();
  const [lastBreakdown, setLastBreakdown] = useState<Array<{ name: string; percentage: number; amount: number }>>([]);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const now = new Date();
        // Calcular lunes (00:00) y domingo (23:59:59.999) de la semana actual
        const day = now.getDay(); // 0=Domingo, 1=Lunes, ...
        const diffToMonday = (day + 6) % 7; // días desde lunes
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - diffToMonday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const [salesData, expensesData] = await Promise.all([
          salesService.getSalesByDateRange(weekStart, weekEnd),
          expensesService.getExpensesByDateRange(weekStart, weekEnd)
        ]);

        const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
        const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
        const profit = totalSales - totalExpenses;

        // Obtener productos más vendidos
        const productSales = salesData.reduce((acc, sale) => {
          acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
          return acc;
        }, {} as Record<string, number>);

        const topProducts = Object.entries(productSales)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([name]) => name);

        setWeeklyData({
          profit,
          sales: totalSales,
          expenses: totalExpenses,
          salesCount: salesData.length,
          topProducts,
        });
      } catch (error) {
        console.error('Error loading weekly data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los datos semanales.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWeeklyData();
  }, [toast]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!weeklyData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se pudieron cargar los datos.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Asesoramiento de Distribución de Beneficios" 
        description="Obtén asesoramiento impulsado por IA sobre cómo distribuir tus beneficios semanales."
      />
      {/* Sección superior: Calculadora y Distribución Recomendada lado a lado */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Columna 1: Calculadora */}
        <div className="space-y-6">
          <DistributionCalculator
            defaultBenefit={weeklyData.profit}
            onRequestAdvice={(overrideProfit, breakdown) => {
              setWeeklyData((prev) => (prev ? { ...prev, profit: overrideProfit } : prev));
              setLastBreakdown(breakdown);
              setGenerateSignal((n) => n + 1);
            }}
          />
        </div>

        {/* Columna 2: Distribución Recomendada: Socio 1 y Socio 2 (arriba) y otros rubros (abajo) */}
        <div>
          {weeklyData && lastBreakdown.length > 0 && (() => {
            const profit = weeklyData.profit || 0;
            let socio1 = 0;
            let socio2 = 0;
            const others: Array<{ name: string; amount: number; percentage: number }> = [];

            for (const item of lastBreakdown) {
              const n = item.name.toLowerCase();
              if (n.includes('socio 1') || n.includes('socio1')) {
                socio1 += item.amount;
              } else if (n.includes('socio 2') || n.includes('socio2')) {
                socio2 += item.amount;
              } else if (n.includes('socios') || (n.includes('socio') && !n.includes('1') && !n.includes('2'))) {
                // Rubro genérico "Socios": dividir 50/50
                socio1 += item.amount / 2;
                socio2 += item.amount / 2;
              } else {
                // Otros rubros (compras futuras, fondo de emergencia, etc.)
                others.push({ name: item.name, amount: item.amount, percentage: item.percentage });
              }
            }

            // Fallback: si no se identificó rubro de socios, dividir beneficio 50/50
            if (socio1 === 0 && socio2 === 0) {
              socio1 = profit / 2;
              socio2 = profit / 2;
            }

            const totalBase = profit > 0 ? profit : (socio1 + socio2);
            const socio1Pct = totalBase > 0 ? ((socio1 / totalBase) * 100) : 0;
            const socio2Pct = totalBase > 0 ? ((socio2 / totalBase) * 100) : 0;

            const buildSummaryText = () => {
              const parts: string[] = [];
              parts.push(`Socio 1: S/. ${socio1.toFixed(2)} (${socio1Pct.toFixed(0)}%)`);
              parts.push(`Socio 2: S/. ${socio2.toFixed(2)} (${socio2Pct.toFixed(0)}%)`);
              if (others.length > 0) parts.push(`${others.length} rubro(s) adicional(es)`);
              return parts.join(' · ');
            };

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Distribución Recomendada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>Socio 1</span>
                    </div>
                    <div className="font-semibold">S/. {socio1.toFixed(2)} — {socio1Pct.toFixed(0)}%</div>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>Socio 2</span>
                    </div>
                    <div className="font-semibold">S/. {socio2.toFixed(2)} — {socio2Pct.toFixed(0)}%</div>
                  </div>
                  {others.length > 0 && (
                    <div className="pt-2 space-y-2">
                      {others.map((o) => (
                        <div key={o.name} className="flex items-center justify-between rounded-md bg-secondary/70 px-3 py-2">
                          <div className="flex items-center gap-2">
                            {o.name.toLowerCase().includes('compra') && (
                              <ShoppingCart className="h-4 w-4 text-green-600" />
                            )}
                            {o.name.toLowerCase().includes('fondo') && (
                              <Shield className="h-4 w-4 text-orange-600" />
                            )}
                            <span>{o.name}</span>
                          </div>
                          <div className="font-semibold">S/. {o.amount.toFixed(2)} — {o.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Total monto y porcentaje */}
                  <div className="mt-2 p-3 rounded-md bg-secondary flex items-center justify-between text-sm">
                    <span>Total</span>
                    <span className="font-semibold">S/. {profit.toFixed(2)} — 100%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">{buildSummaryText()}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
                        const fmt = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
                        const formatDate = (d: Date) => fmt.format(d);
                        const now = new Date();
                        const day = now.getDay(); // 0=dom,1=lun,...
                        const diffToMonday = (day + 6) % 7;
                        const monday = new Date(now);
                        monday.setHours(0,0,0,0);
                        monday.setDate(monday.getDate() - diffToMonday);
                        const sunday = new Date(monday);
                        sunday.setDate(monday.getDate() + 6);
                        sunday.setHours(23,59,59,999);

                        const lines: string[] = [];
                        lines.push('📊 Distribución recomendada');
                        lines.push(`Semana: ${formatDate(monday)} - ${formatDate(sunday)}`);
                        lines.push('');
                        lines.push('👥 Socios');
                        lines.push(`• Socio 1: ${currency.format(socio1)} (${socio1Pct.toFixed(0)}%)`);
                        lines.push(`• Socio 2: ${currency.format(socio2)} (${socio2Pct.toFixed(0)}%)`);
                        if (others.length > 0) {
                          lines.push('');
                          lines.push('📦 Otros rubros');
                          for (const o of others) {
                            lines.push(`• ${o.name}: ${currency.format(o.amount)} (${o.percentage}%)`);
                          }
                        }
                        lines.push('');
                        lines.push(`🧮 Total: ${currency.format(profit)} (100%)`);

                        const text = lines.join('\n');
                        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* Sección inferior: Asesor Financiero IA a ancho completo */}
      <div className="mt-6">
        <AIAdvisor weeklyData={weeklyData} generateSignal={generateSignal} breakdown={lastBreakdown} />
      </div>
    </>
  );
}
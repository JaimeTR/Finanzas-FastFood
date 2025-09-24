'use client';

import { useEffect, useState } from 'react';
// import duplicado eliminado
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, DollarSign, AlertTriangle, Calendar, Loader2, Copy, Share2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProfitDistributionAdvice, type ProfitDistributionInput, type ProfitDistributionOutput } from '@/ai/flows/profit-distribution-advice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AIAdvisorProps {
  weeklyData: {
    profit: number;
    sales: number;
    expenses: number;
    salesCount: number;
    topProducts: string[];
  };
  generateSignal?: number; // cuando cambie, dispara generateAdvice
  breakdown?: Array<{ name: string; percentage: number; amount: number }>; // distribución desde la calculadora
}

export function AIAdvisor({ weeklyData, generateSignal, breakdown }: AIAdvisorProps) {
  const [advice, setAdvice] = useState<ProfitDistributionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true);
  const { toast } = useToast();

  const currentMonth = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' }).format(new Date());
  const formatter = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const generateAdvice = async () => {
    setIsLoading(true);
    try {
      const input: ProfitDistributionInput = {
        weeklyProfit: weeklyData.profit,
        totalSales: weeklyData.sales,
        totalExpenses: weeklyData.expenses,
        salesCount: weeklyData.salesCount,
        topSellingProducts: weeklyData.topProducts,
        businessType: 'fast_food',
        currentMonth: currentMonth,
      };

      const result = await getProfitDistributionAdvice(input);
      setAdvice(result);
      
      toast({
        title: '🤖 Análisis completado',
        description: 'Gemini Flash ha generado tu reporte financiero personalizado.',
      });
    } catch (error: any) {
      console.error('Error generando consejo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo generar el consejo. Verifica la configuración de la API.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Consultar endpoint que indica si la API está configurada
    fetch('/api/ai-config')
      .then((r) => r.json())
      .then((json) => setAiConfigured(Boolean(json?.isConfigured)))
      .catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    // Si recibimos una señal externa y la IA está configurada, dispara el análisis
    if (typeof generateSignal === 'number' && generateSignal > 0 && aiConfigured && !isLoading) {
      generateAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateSignal]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Asesor Financiero IA</CardTitle>
              <Badge variant="secondary">Gemini Flash</Badge>
          </div>
          <CardDescription>
            Análisis inteligente de tus finanzas con recomendaciones personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!aiConfigured && (
            <div className="mb-4">
              <Alert variant="destructive">
                <AlertTitle>API de IA no configurada</AlertTitle>
                <AlertDescription>
                  Falta la variable <code>GOOGLE_GENKIT_API_KEY</code>. Agrega tu API key al archivo <code>.env.local</code> y reinicia el servidor de desarrollo.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Ganancia</p>
              <p className="font-bold text-green-600">{formatter.format(weeklyData.profit)}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Ventas</p>
              <p className="font-bold text-blue-600">{formatter.format(weeklyData.sales)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Gastos</p>
              <p className="font-bold text-red-600">{formatter.format(weeklyData.expenses)}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Ventas</p>
              <p className="font-bold text-purple-600">{weeklyData.salesCount}</p>
            </div>
          </div>

          <Button 
            onClick={generateAdvice} 
            disabled={isLoading || !aiConfigured}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando con Gemini Flash...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generar Análisis Inteligente
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {advice && (
        <div className="space-y-4">
          {/* Distribución de Ganancias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                Distribución Recomendada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdown && breakdown.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {breakdown.map((item) => (
                      <div key={item.name} className="text-center p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-2xl font-bold">{formatter.format(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-md bg-secondary flex items-center justify-between text-sm">
                    <span>Total</span>
                    <span className="font-semibold">{formatter.format(breakdown.reduce((s, i) => s + i.amount, 0))} — 100%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Para Socios</p>
                      <p className="text-2xl font-bold text-blue-600">{formatter.format(advice.partnerAmount)}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Reinversión</p>
                      <p className="text-2xl font-bold text-green-600">{formatter.format(advice.businessInvestment)}</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Fondo Emergencia</p>
                      <p className="text-2xl font-bold text-orange-600">{formatter.format(advice.emergencyFund)}</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-md bg-secondary flex items-center justify-between text-sm">
                    <span>Total</span>
                    <span className="font-semibold">{formatter.format((advice.partnerAmount ?? 0) + (advice.businessInvestment ?? 0) + (advice.emergencyFund ?? 0))} — 100%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Consejos de IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-purple-600" />
                Análisis Financiero Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">💡 Consejos Generales</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{advice.advice}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">🍔 Recomendaciones para el Negocio</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{advice.businessRecommendations}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">📈 Predicción Próxima Semana</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{advice.nextWeekPrediction}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    const text = `Análisis Financiero Inteligente\n\nConsejos:\n${advice.advice}\n\nRecomendaciones:\n${advice.businessRecommendations}\n\nPredicción próxima semana:\n${advice.nextWeekPrediction}`;
                    try {
                      await navigator.clipboard.writeText(text);
                      toast({ title: 'Copiado', description: 'Análisis IA copiado al portapapeles.' });
                    } catch {
                      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo copiar.' });
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar resumen
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const lines: string[] = [];
                    lines.push('🤖 Análisis Financiero Inteligente');
                    lines.push('');
                    lines.push('💡 Consejos:');
                    lines.push(advice.advice);
                    lines.push('');
                    lines.push('🍔 Recomendaciones:');
                    lines.push(advice.businessRecommendations);
                    lines.push('');
                    lines.push('📈 Predicción próxima semana:');
                    lines.push(advice.nextWeekPrediction);
                    if (breakdown && breakdown.length > 0) {
                      lines.push('');
                      lines.push('📊 Distribución recomendada');
                      const total = breakdown.reduce((s, i) => s + i.amount, 0);
                      for (const item of breakdown) {
                        lines.push(`• ${item.name}: ${formatter.format(item.amount)} (${item.percentage}%)`);
                      }
                      lines.push(`🧮 Total: ${formatter.format(total)} (100%)`);
                    }
                    const text = lines.join('\n');
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Compartir por WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const text = `Análisis Financiero Inteligente\n\nConsejos:\n${advice.advice}\n\nRecomendaciones:\n${advice.businessRecommendations}\n\nPredicción próxima semana:\n${advice.nextWeekPrediction}`;
                    const html = `<!doctype html><html><head><meta charset=\"utf-8\"/><title>Análisis Financiero IA</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;line-height:1.5} h1{font-size:18px;margin:0 0 12px} pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit}</style></head><body><h1>Análisis Financiero IA</h1><pre>${text.replace(/</g,'&lt;')}</pre></body></html>`;
                    const w = window.open('', '_blank');
                    if (!w) return;
                    w.document.open();
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    w.onload = () => w.print();
                  }}
                >
                  <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
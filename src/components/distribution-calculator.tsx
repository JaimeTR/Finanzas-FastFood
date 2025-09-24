"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { DistributionType } from '@/lib/types';
import { distributionTypeService } from '@/lib/supabase-services';

interface DistributionCalculatorProps {
  onRequestAdvice: (overrideProfit: number, breakdown: Array<{ name: string; percentage: number; amount: number }>) => void;
  defaultBenefit?: number; // Beneficio semanal por defecto proveniente del análisis de ventas/gastos
}

export default function DistributionCalculator({ onRequestAdvice, defaultBenefit }: DistributionCalculatorProps) {
  const [benefit, setBenefit] = useState<number>(typeof defaultBenefit === 'number' ? defaultBenefit : 1000);
  const [types, setTypes] = useState<DistributionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Cargar desde storage si existe
    try {
      const saved = localStorage.getItem('dist_calc_state');
      if (saved) {
        const s = JSON.parse(saved);
        if (typeof s.benefit === 'number') setBenefit(s.benefit);
        if (Array.isArray(s.types)) setTypes(s.types);
      } else if (typeof defaultBenefit === 'number') {
        // si no hay guardado previo, inicializar con defaultBenefit
        setBenefit(defaultBenefit);
      }
    } catch {}

    distributionTypeService.getDistributionTypes()
      .then((t) => {
        // Si no había tipos en storage, usar los de DB
        setTypes((prev) => (prev && prev.length > 0 ? prev : t));
      })
      .catch(() => setTypes([
        { id: 'local_socios', name: 'Socios', percentage: 50 },
        { id: 'local_compras', name: 'Compras Futuras', percentage: 30 },
        { id: 'local_fondo', name: 'Fondo de Emergencia', percentage: 20 },
      ]))
      .finally(() => setLoading(false));
    // Escuchar un evento de refresco (cuando se cambian tipos en configuración)
    const handler = () => {
      distributionTypeService.getDistributionTypes()
        .then((t) => setTypes(t))
        .catch(() => {});
      try {
        const saved = localStorage.getItem('dist_active_type_ids');
        if (saved) setActiveSet(new Set(JSON.parse(saved)));
      } catch {}
    };
    window.addEventListener('dist-types-updated', handler as any);
    // Cargar set activo al montar
    try {
      const saved = localStorage.getItem('dist_active_type_ids');
      if (saved) setActiveSet(new Set(JSON.parse(saved)));
    } catch {}
    return () => window.removeEventListener('dist-types-updated', handler as any);
  }, [defaultBenefit]);

  const visibleTypes = useMemo(() => {
    if (!activeSet || activeSet.size === 0) return types; // fallback: mostrar todos si no hay selección
    return types.filter((t) => activeSet.has(t.id));
  }, [types, activeSet]);

  const totalPct = useMemo(() => visibleTypes.reduce((acc, t) => acc + (t.percentage || 0), 0), [visibleTypes]);
  const formatter = useMemo(() => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }), []);

  const breakdown = useMemo(() => visibleTypes.map((t) => ({
    name: t.name,
    percentage: t.percentage,
    amount: Math.round((t.percentage / 100) * benefit * 100) / 100,
  })), [visibleTypes, benefit]);

  const setPct = (id: string, pct: number) => {
    setTypes((prev) => prev.map((t) => t.id === id ? { ...t, percentage: pct } : t));
  };

  const handleRequest = () => {
    onRequestAdvice(benefit, breakdown);
  };

  // Persistir estado
  useEffect(() => {
    try {
      const payload = JSON.stringify({ benefit, types });
      localStorage.setItem('dist_calc_state', payload);
    } catch {}
  }, [benefit, types]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Distribución</CardTitle>
        <CardDescription>Ingresa tus beneficios y ajusta los porcentajes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Beneficio Semanal Total</label>
          <Input type="number" value={benefit} onChange={(e) => setBenefit(Number(e.target.value))} />
        </div>

        {visibleTypes.map((t) => (
          <div key={t.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{t.name}</span>
              <span>{t.percentage}% — {formatter.format((t.percentage / 100) * benefit)}</span>
            </div>
            <Slider value={[t.percentage]} onValueChange={(v) => setPct(t.id, v[0])} min={0} max={100} step={1} />
          </div>
        ))}

        <div className="p-3 rounded-md bg-secondary flex items-center justify-between text-sm">
          <span>Asignación Total:</span>
          <span className={totalPct === 100 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{totalPct}%</span>
        </div>

        <Button className="w-full" onClick={handleRequest} disabled={totalPct !== 100}>Obtener Asesoramiento</Button>
      </CardContent>
    </Card>
  );
}

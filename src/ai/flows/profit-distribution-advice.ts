'use server';

/**
 * @fileOverview A flow that calculates weekly profit and provides advice on how to distribute it.
 *
 * - getProfitDistributionAdvice - A function that calculates weekly profit and provides advice on distribution.
 * - ProfitDistributionInput - The input type for the getProfitDistributionAdvice function.
 * - ProfitDistributionOutput - The return type for the getProfitDistributionAdvice function.
 */

import { ai, isAIConfigured } from '@/ai/genkit';
import {z} from 'genkit';

const ProfitDistributionInputSchema = z.object({
  weeklyProfit: z.number().describe('Ganancia total de la semana en soles peruanos.'),
  totalSales: z.number().describe('Total de ventas de la semana.'),
  totalExpenses: z.number().describe('Total de gastos de la semana.'),
  salesCount: z.number().describe('Número total de ventas realizadas.'),
  topSellingProducts: z.array(z.string()).describe('Productos más vendidos de la semana.'),
  businessType: z.string().default('fast_food').describe('Tipo de negocio: fast food'),
  currentMonth: z.string().describe('Mes actual para recomendaciones estacionales.'),
});
export type ProfitDistributionInput = z.infer<typeof ProfitDistributionInputSchema>;

const ProfitDistributionOutputSchema = z.object({
  partnerAmount: z.number().describe('Cantidad a distribuir entre los 2 socios (50% para cada uno si aplica).'),
  businessInvestment: z.number().describe('Cantidad recomendada para reinvertir en el negocio.'),
  emergencyFund: z.number().describe('Cantidad recomendada para fondo de emergencia.'),
  advice: z.string().describe('Consejo detallado sobre distribución de ganancias y estrategias.'),
  businessRecommendations: z.string().describe('Recomendaciones específicas para mejorar el negocio de fast food.'),
  nextWeekPrediction: z.string().describe('Predicción y recomendaciones para la próxima semana.'),
});
export type ProfitDistributionOutput = z.infer<typeof ProfitDistributionOutputSchema>;

export async function getProfitDistributionAdvice(
  input: ProfitDistributionInput
): Promise<ProfitDistributionOutput> {
  if (!isAIConfigured) {
    throw new Error('La API de Google Genkit no está configurada. Define GOOGLE_GENKIT_API_KEY en tu entorno.');
  }
  return profitDistributionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitDistributionPrompt',
  input: {schema: ProfitDistributionInputSchema},
  output: {schema: ProfitDistributionOutputSchema},
  prompt: `Eres un asesor financiero especializado en negocios de comida rápida (fast food) en Perú.

  Analiza la siguiente información semanal del negocio "Fast Food Finanzas":

  **DATOS FINANCIEROS:**
  - Ganancia neta semanal: S/. {{{weeklyProfit}}}
  - Total de ventas: S/. {{{totalSales}}}
  - Total de gastos: S/. {{{totalExpenses}}}
  - Número de ventas: {{{salesCount}}}
  - Productos más vendidos: {{{topSellingProducts}}}
  - Mes actual: {{{currentMonth}}}

  **ESTRUCTURA DE DISTRIBUCIÓN:**
  - 2 Socios operativos (distribución entre ellos)
  - Reinversión en el negocio
  - Fondo de emergencia

  **INSTRUCCIONES:**
  1. Calcula una distribución coherente entre socios, reinversión y fondo (sin administrador)
  2. Recomienda cuánto destinar a reinversión del negocio (compra de equipos, ingredientes, marketing)
  3. Sugiere un fondo de emergencia apropiado
  4. Proporciona consejos específicos para un negocio de fast food
  5. Analiza las tendencias de ventas y sugiere mejoras
  6. Da predicciones y recomendaciones para la próxima semana

  **CONTEXTO PERUANO:**
  - Considera la realidad económica peruana
  - Incluye recomendaciones sobre precios, productos populares
  - Sugiere estrategias para días de mayor/menor venta
  - Considera factores estacionales y eventos locales

  Responde en español peruano con números exactos (2 decimales) y consejos prácticos.`,
});

const profitDistributionFlow = ai.defineFlow(
  {
    name: 'profitDistributionFlow',
    inputSchema: ProfitDistributionInputSchema,
    outputSchema: ProfitDistributionOutputSchema,
  },
  async (input: ProfitDistributionInput) => {
    // Cálculos base según la estructura definida
  const partnerAmount = parseFloat((input.weeklyProfit * 0.50).toFixed(2)); // 50% del total para socios (a repartir entre ambos)
    
    // Recomendaciones de reinversión (10-15% de las ventas)
    const businessInvestment = parseFloat((input.totalSales * 0.12).toFixed(2));
    
    // Fondo de emergencia (5-8% de las ventas)
    const emergencyFund = parseFloat((input.totalSales * 0.06).toFixed(2));

    const {output} = await prompt({
      ...input,
    });
    
    return output!;
  }
);

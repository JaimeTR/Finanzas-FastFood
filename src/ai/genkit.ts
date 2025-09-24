import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Bandera para verificar que la API key esté disponible en el entorno del servidor
export const isAIConfigured = !!process.env.GOOGLE_GENKIT_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENKIT_API_KEY })
  ],
  model: 'googleai/gemini-1.5-flash',
});

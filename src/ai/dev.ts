import { config } from 'dotenv';
config();

// Verificar que la API key esté configurada
if (!process.env.GOOGLE_GENKIT_API_KEY) {
  console.error('❌ Error: GOOGLE_GENKIT_API_KEY no está configurada en .env.local');
  process.exit(1);
}

console.log('🤖 Genkit configurado con Gemini Pro');
console.log('🔑 API Key configurada:', process.env.GOOGLE_GENKIT_API_KEY ? '✅ Sí' : '❌ No');

import '@/ai/flows/profit-distribution-advice.ts';
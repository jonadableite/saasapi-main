// test-hotmart-config.js
require('dotenv').config();

console.log('=== Teste de Configuração da Hotmart ===');
console.log('HOTMART_WEBHOOK_TOKEN:', process.env.HOTMART_WEBHOOK_TOKEN);
console.log('HOTMART_WEBHOOK_TOKENHOTMART_WEBHOOK_TOKEN:', process.env.HOTMART_WEBHOOK_TOKENHOTMART_WEBHOOK_TOKEN);
console.log('HOTMART_CLIENT_ID:', process.env.HOTMART_CLIENT_ID);
console.log('HOTMART_CLIENT_SECRET:', process.env.HOTMART_CLIENT_SECRET);

// Teste de validação do token
const testHottok = 'SE9WpdWSlmkx5bF2DswqYm1lHem8R53a1350a9-8768-4fe1-89d1-39079b94c48e';
const envHottok = process.env.HOTMART_WEBHOOK_TOKEN || process.env.HOTMART_WEBHOOK_TOKENHOTMART_WEBHOOK_TOKEN;

console.log('\n=== Teste de Validação ===');
console.log('Token de teste:', testHottok);
console.log('Token do env:', envHottok);
console.log('Tokens são iguais?', testHottok === envHottok);

if (testHottok === envHottok) {
  console.log('✅ Configuração correta!');
} else {
  console.log('❌ Configuração incorreta!');
  console.log('Verifique se a variável HOTMART_WEBHOOK_TOKEN está correta no arquivo .env');
}
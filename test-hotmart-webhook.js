// test-hotmart-webhook.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:9000';
const WEBHOOK_URL = `${API_BASE_URL}/api/hotmart/webhook/user`;

// Dados de teste do webhook
const webhookData = {
  event: 'PURCHASE_APPROVED',
  eventDate: new Date().toISOString(),
  data: {
    transaction: 'TEST_TRANSACTION_123',
    subscriberCode: 'TEST_SUBSCRIBER_456',
    productId: 'TEST_PRODUCT_789',
    productName: 'Produto de Teste',
    customer: {
      name: 'João Silva',
      email: 'joao.silva@teste.com',
      document: '123.456.789-00',
      phone: '+5511999999999',
      address: {
        country: 'Brasil',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        address: 'Rua Teste, 123',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro'
      }
    },
    payment: {
      type: 'CREDIT_CARD',
      method: 'VISA',
      status: 'APPROVED',
      value: 97.00,
      currency: 'BRL',
      installments: 1,
      totalInstallments: 1
    },
    subscription: {
      status: 'ACTIVE',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    affiliate: {
      code: 'AFF001',
      name: 'Afiliado Teste',
      commissionValue: 9.70,
      commissionPercentage: 10
    },
    producer: {
      code: 'PROD001',
      name: 'Produtor Teste',
      value: 77.60,
      percentage: 80
    },
    platform: {
      value: 9.70,
      percentage: 10
    }
  }
};

// Token da Hotmart (do seu env)
const hottok = 'SE9WpdWSlmkx5bF2DswqYm1lHem8R53a1350a9-8768-4fe1-89d1-39079b94c48e';

async function testWebhook() {
  try {
    console.log('=== Teste de Webhook da Hotmart ===');
    console.log('URL:', WEBHOOK_URL);
    console.log('Evento:', webhookData.event);
    console.log('Transação:', webhookData.data.transaction);
    console.log('Assinante:', webhookData.data.subscriberCode);

    const response = await axios.post(WEBHOOK_URL, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'x-hotmart-hottok': hottok
      },
      timeout: 10000
    });

    console.log('\n✅ Webhook processado com sucesso!');
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);
  } catch (error) {
    console.log('\n❌ Erro ao processar webhook:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    } else {
      console.log('Erro:', error.message);
    }
  }
}

// Executar teste
testWebhook();
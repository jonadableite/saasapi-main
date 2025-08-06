// test-auto-account.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:9000';
const ADMIN_TOKEN = 'seu_token_admin_aqui'; // Substitua pelo token de admin válido

// Dados de teste
const testPaymentData = {
  customerEmail: 'teste.auto@whatlead.com.br',
  customerName: 'Usuário Teste Automático',
  customerPhone: '+5511999999999',
  paymentValue: 97.00,
  paymentStatus: 'APPROVED',
  subscriptionStatus: 'ACTIVE',
  productId: 'TEST_PRODUCT_001',
  productName: 'Whatlead Pro - Teste',
  transactionId: 'TEST_TRANSACTION_001',
  subscriberCode: 'TEST_SUBSCRIBER_001',
  source: 'manual',
};

async function testAutoAccountCreation() {
  console.log('🧪 Iniciando testes do sistema de criação automática de contas...\n');

  try {
    // 1. Testar criação manual de conta
    console.log('1️⃣ Testando criação manual de conta...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/api/auto-account/create`,
      testPaymentData,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (createResponse.data.success) {
      console.log('✅ Conta criada com sucesso!');
      console.log('   ID:', createResponse.data.data.userId);
      console.log('   Email:', createResponse.data.data.email);
      console.log('   Plano:', createResponse.data.data.plan);
    } else {
      console.log('❌ Erro ao criar conta:', createResponse.data.error);
    }

    // 2. Testar verificação de conta existente
    console.log('\n2️⃣ Testando verificação de conta existente...');
    const checkResponse = await axios.get(
      `${API_BASE_URL}/api/auto-account/check/${testPaymentData.customerEmail}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );

    if (checkResponse.data.success) {
      console.log('✅ Verificação realizada com sucesso!');
      console.log('   Existe:', checkResponse.data.exists);
      console.log('   Email:', checkResponse.data.email);
    } else {
      console.log('❌ Erro na verificação:', checkResponse.data.error);
    }

    // 3. Testar obtenção de informações da conta
    console.log('\n3️⃣ Testando obtenção de informações da conta...');
    const accountResponse = await axios.get(
      `${API_BASE_URL}/api/auto-account/account/${testPaymentData.customerEmail}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );

    if (accountResponse.data.success) {
      console.log('✅ Informações obtidas com sucesso!');
      console.log('   Nome:', accountResponse.data.data.name);
      console.log('   Plano:', accountResponse.data.data.plan);
      console.log('   Empresa:', accountResponse.data.data.company?.name);
      console.log('   Instâncias:', accountResponse.data.data.instances?.length || 0);
    } else {
      console.log('❌ Erro ao obter informações:', accountResponse.data.error);
    }

    // 4. Testar reenvio de email de boas-vindas
    console.log('\n4️⃣ Testando reenvio de email de boas-vindas...');
    const resendResponse = await axios.post(
      `${API_BASE_URL}/api/auto-account/resend-welcome/${testPaymentData.customerEmail}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (resendResponse.data.success) {
      console.log('✅ Email de boas-vindas reenviado com sucesso!');
    } else {
      console.log('❌ Erro ao reenviar email:', resendResponse.data.error);
    }

    console.log('\n🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

async function testHotmartWebhook() {
  console.log('\n🔄 Testando webhook da Hotmart...\n');

  const webhookData = {
    event: 'PURCHASE_APPROVED',
    eventDate: new Date().toISOString(),
    data: {
      transaction: 'TEST_WEBHOOK_TRANSACTION_001',
      subscriberCode: 'TEST_WEBHOOK_SUBSCRIBER_001',
      productId: 'TEST_WEBHOOK_PRODUCT_001',
      productName: 'Whatlead Pro - Webhook Teste',
      customer: {
        name: 'Usuário Webhook Teste',
        email: 'webhook.teste@whatlead.com.br',
        phone: '+5511888888888',
        document: '123.456.789-00',
        address: {
          country: 'Brasil',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          address: 'Rua Teste Webhook, 123',
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
        code: 'AFF_WEBHOOK_001',
        name: 'Afiliado Webhook Teste',
        commissionValue: 9.70,
        commissionPercentage: 10
      },
      producer: {
        code: 'PROD_WEBHOOK_001',
        name: 'Produtor Webhook Teste',
        value: 77.60,
        percentage: 80
      },
      platform: {
        value: 9.70,
        percentage: 10
      }
    }
  };

  // Token da Hotmart (substitua pelo token real)
  const hottok = 'SEU_HOTTOK_AQUI';

  try {
    const webhookResponse = await axios.post(
      `${API_BASE_URL}/api/hotmart/webhook/user`,
      webhookData,
      {
        headers: {
          'x-hotmart-hottok': hottok,
          'Content-Type': 'application/json',
        },
      }
    );

    if (webhookResponse.data.success) {
      console.log('✅ Webhook da Hotmart processado com sucesso!');
      console.log('   Evento:', webhookData.event);
      console.log('   Transação:', webhookData.data.transaction);
      console.log('   Cliente:', webhookData.data.customer.name);
    } else {
      console.log('❌ Erro no webhook:', webhookResponse.data.error);
    }
  } catch (error) {
    console.error('❌ Erro no webhook da Hotmart:', error.response?.data || error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes do sistema de criação automática de contas\n');

  await testAutoAccountCreation();
  await testHotmartWebhook();

  console.log('\n✨ Testes concluídos!');
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAutoAccountCreation,
  testHotmartWebhook,
  runTests,
};

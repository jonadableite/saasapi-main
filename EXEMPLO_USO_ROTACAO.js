// Exemplo de uso do Sistema de Rotação de Instâncias WhatsApp
// Este arquivo demonstra como configurar e usar o sistema de rotação

const API_BASE_URL = 'http://localhost:3000/api';

// Função para fazer requisições autenticadas
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('authToken'); // Seu token de autenticação

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 1. Listar instâncias disponíveis
async function listarInstanciasDisponiveis() {
  try {
    console.log('🔍 Listando instâncias disponíveis...');

    const response = await apiRequest('/campaigns/instances/available');

    console.log('✅ Instâncias disponíveis:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao listar instâncias:', error);
    throw error;
  }
}

// 2. Criar uma nova campanha
async function criarCampanha(nome, descricao, tipo) {
  try {
    console.log('📝 Criando nova campanha...');

    const response = await apiRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: nome,
        description: descricao,
        type: tipo
      })
    });

    console.log('✅ Campanha criada:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao criar campanha:', error);
    throw error;
  }
}

// 3. Adicionar instâncias à campanha com rotação
async function configurarRotacaoInstancias(campaignId, instanceIds, estrategia = 'RANDOM', limiteMensagens = 50) {
  try {
    console.log('🔄 Configurando rotação de instâncias...');

    const response = await apiRequest(`/campaigns/${campaignId}/instances`, {
      method: 'POST',
      body: JSON.stringify({
        instanceIds: instanceIds,
        useRotation: true,
        rotationStrategy: estrategia,
        maxMessagesPerInstance: limiteMensagens
      })
    });

    console.log('✅ Rotação configurada:', response.message);
    return response;
  } catch (error) {
    console.error('❌ Erro ao configurar rotação:', error);
    throw error;
  }
}

// 4. Importar leads para a campanha
async function importarLeads(campaignId, leadsData) {
  try {
    console.log('📊 Importando leads...');

    const formData = new FormData();
    formData.append('file', leadsData);

    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/leads/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Leads importados:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao importar leads:', error);
    throw error;
  }
}

// 5. Iniciar campanha com rotação automática
async function iniciarCampanhaComRotacao(campaignId, mensagem, minDelay = 10, maxDelay = 30) {
  try {
    console.log('🚀 Iniciando campanha com rotação automática...');

    const response = await apiRequest(`/campaigns/${campaignId}/start`, {
      method: 'POST',
      body: JSON.stringify({
        message: mensagem,
        minDelay: minDelay,
        maxDelay: maxDelay
        // Note: NÃO especificamos instanceName - o sistema usará rotação automática
      })
    });

    console.log('✅ Campanha iniciada:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao iniciar campanha:', error);
    throw error;
  }
}

// 6. Monitorar estatísticas das instâncias
async function monitorarEstatisticas(campaignId) {
  try {
    console.log('📊 Obtendo estatísticas das instâncias...');

    const response = await apiRequest(`/campaigns/${campaignId}/instances/stats`);

    console.log('✅ Estatísticas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
}

// 7. Monitorar progresso da campanha
async function monitorarProgresso(campaignId) {
  try {
    console.log('📈 Obtendo progresso da campanha...');

    const response = await apiRequest(`/campaigns/${campaignId}/progress`);

    console.log('✅ Progresso:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao obter progresso:', error);
    throw error;
  }
}

// 8. Resetar contadores de mensagens
async function resetarContadores(campaignId) {
  try {
    console.log('🔄 Resetando contadores de mensagens...');

    const response = await apiRequest(`/campaigns/${campaignId}/instances/reset`, {
      method: 'POST'
    });

    console.log('✅ Contadores resetados:', response.message);
    return response;
  } catch (error) {
    console.error('❌ Erro ao resetar contadores:', error);
    throw error;
  }
}

// 9. Ativar/desativar instância específica
async function toggleInstancia(campaignId, instanceId, ativo) {
  try {
    console.log(`${ativo ? '🟢' : '🔴'} ${ativo ? 'Ativando' : 'Desativando'} instância...`);

    const response = await apiRequest(`/campaigns/${campaignId}/instances/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({
        instanceId: instanceId,
        isActive: ativo
      })
    });

    console.log('✅ Status da instância alterado:', response.message);
    return response;
  } catch (error) {
    console.error('❌ Erro ao alterar status da instância:', error);
    throw error;
  }
}

// ===== EXEMPLO DE USO COMPLETO =====

async function exemploUsoCompleto() {
  try {
    console.log('🎯 Iniciando exemplo completo de uso da rotação de instâncias...');

    // 1. Listar instâncias disponíveis
    const instancias = await listarInstanciasDisponiveis();

    if (instancias.length < 2) {
      throw new Error('É necessário ter pelo menos 2 instâncias conectadas para usar rotação');
    }

    // 2. Criar campanha
    const campanha = await criarCampanha(
      'Campanha com Rotação - Teste',
      'Campanha para testar o sistema de rotação de instâncias',
      'mass'
    );

    // 3. Configurar rotação (usando as 3 primeiras instâncias)
    const instanceIds = instancias.slice(0, 3).map(inst => inst.id);
    await configurarRotacaoInstancias(
      campanha.id,
      instanceIds,
      'RANDOM', // Estratégia: aleatória
      100 // Limite: 100 mensagens por instância
    );

    // 4. Simular importação de leads (você precisaria de um arquivo real)
    console.log('📝 Simulando importação de leads...');
    // await importarLeads(campanha.id, arquivoLeads);

    // 5. Iniciar campanha
    await iniciarCampanhaComRotacao(
      campanha.id,
      'Olá! Esta é uma mensagem de teste do sistema de rotação de instâncias. 🚀',
      15, // Delay mínimo: 15 segundos
      45  // Delay máximo: 45 segundos
    );

    // 6. Monitorar progresso em tempo real
    const monitoramento = setInterval(async () => {
      try {
        const [estatisticas, progresso] = await Promise.all([
          monitorarEstatisticas(campanha.id),
          monitorarProgresso(campanha.id)
        ]);

        console.log('📊 Status atual:');
        console.log(`  - Total de mensagens enviadas: ${estatisticas.totalMessagesSent}`);
        console.log(`  - Instâncias ativas: ${estatisticas.activeInstances}`);
        console.log(`  - Instâncias conectadas: ${estatisticas.connectedInstances}`);
        console.log(`  - Progresso da campanha: ${progresso.progress}%`);

        // Detalhes por instância
        estatisticas.instances.forEach(inst => {
          console.log(`  📱 ${inst.instanceName}: ${inst.messagesSent}/${inst.maxMessages || '∞'} mensagens`);
        });

        // Parar monitoramento se a campanha foi concluída
        if (progresso.status === 'completed') {
          console.log('✅ Campanha concluída!');
          clearInterval(monitoramento);
        }

      } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
        clearInterval(monitoramento);
      }
    }, 30000); // Verificar a cada 30 segundos

    console.log('🎉 Exemplo iniciado com sucesso! Monitorando progresso...');

  } catch (error) {
    console.error('❌ Erro no exemplo completo:', error);
  }
}

// ===== FUNÇÕES AUXILIARES =====

// Função para pausar campanha
async function pausarCampanha(campaignId) {
  try {
    const response = await apiRequest(`/campaigns/${campaignId}/pause`, {
      method: 'POST'
    });
    console.log('⏸️ Campanha pausada:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao pausar campanha:', error);
    throw error;
  }
}

// Função para retomar campanha
async function retomarCampanha(campaignId) {
  try {
    const response = await apiRequest(`/campaigns/${campaignId}/resume`, {
      method: 'POST'
    });
    console.log('▶️ Campanha retomada:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao retomar campanha:', error);
    throw error;
  }
}

// Função para parar campanha
async function pararCampanha(campaignId) {
  try {
    const response = await apiRequest(`/campaigns/${campaignId}/stop`, {
      method: 'POST'
    });
    console.log('⏹️ Campanha parada:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao parar campanha:', error);
    throw error;
  }
}

// ===== EXPORTAÇÕES =====

// Para uso em módulos ES6
export {
  configurarRotacaoInstancias, criarCampanha, exemploUsoCompleto, importarLeads,
  iniciarCampanhaComRotacao, listarInstanciasDisponiveis, monitorarEstatisticas,
  monitorarProgresso, pararCampanha, pausarCampanha, resetarContadores, retomarCampanha, toggleInstancia
};

// Para uso em navegador (global)
if (typeof window !== 'undefined') {
  window.WhatsAppRotationAPI = {
    listarInstanciasDisponiveis,
    criarCampanha,
    configurarRotacaoInstancias,
    importarLeads,
    iniciarCampanhaComRotacao,
    monitorarEstatisticas,
    monitorarProgresso,
    resetarContadores,
    toggleInstancia,
    pausarCampanha,
    retomarCampanha,
    pararCampanha,
    exemploUsoCompleto
  };
}

console.log('📚 Sistema de Rotação de Instâncias WhatsApp carregado!');
console.log('💡 Use exemploUsoCompleto() para testar o sistema');
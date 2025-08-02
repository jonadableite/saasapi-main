# Sistema de Rotação de Instâncias WhatsApp

Este documento explica como usar o sistema de rotação de instâncias WhatsApp para evitar banimentos e distribuir a carga de mensagens entre múltiplas instâncias.

## 🎯 Objetivo

O sistema de rotação permite que você:
- Use múltiplas instâncias WhatsApp em uma única campanha
- Distribua mensagens automaticamente entre as instâncias
- Evite sobrecarregar uma única instância
- Reduza o risco de banimentos do WhatsApp

## 🔧 Configuração

### 1. Estratégias de Rotação

O sistema oferece três estratégias de rotação:

- **RANDOM**: Seleciona instâncias aleatoriamente
- **SEQUENTIAL**: Usa instâncias em sequência (round-robin)
- **LOAD_BALANCED**: Distribui baseado na carga (menos mensagens enviadas)

### 2. Limite de Mensagens por Instância

Você pode definir um limite máximo de mensagens por instância antes de alternar para a próxima.

## 📡 Endpoints da API

### Listar Instâncias Disponíveis
```http
GET /campaigns/instances/available
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "instanceName": "instance-1",
      "connectionStatus": "CONNECTED",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Adicionar Instâncias a uma Campanha
```http
POST /campaigns/{campaignId}/instances
```

**Body:**
```json
{
  "instanceIds": ["uuid1", "uuid2", "uuid3"],
  "useRotation": true,
  "rotationStrategy": "RANDOM",
  "maxMessagesPerInstance": 50
}
```

**Parâmetros:**
- `instanceIds`: Array de IDs das instâncias
- `useRotation`: Habilita/desabilita rotação
- `rotationStrategy`: Estratégia de rotação (RANDOM, SEQUENTIAL, LOAD_BALANCED)
- `maxMessagesPerInstance`: Limite opcional de mensagens por instância

### Remover Instâncias de uma Campanha
```http
DELETE /campaigns/{campaignId}/instances
```

**Body:**
```json
{
  "instanceIds": ["uuid1", "uuid2"]
}
```

### Obter Estatísticas das Instâncias
```http
GET /campaigns/{campaignId}/instances/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalInstances": 3,
    "activeInstances": 2,
    "connectedInstances": 2,
    "totalMessagesSent": 150,
    "instances": [
      {
        "instanceName": "instance-1",
        "messagesSent": 50,
        "maxMessages": 100,
        "lastUsedAt": "2024-01-01T10:00:00Z",
        "isActive": true,
        "connectionStatus": "CONNECTED"
      }
    ]
  }
}
```

### Resetar Contadores de Mensagens
```http
POST /campaigns/{campaignId}/instances/reset
```

### Ativar/Desativar Instância
```http
PATCH /campaigns/{campaignId}/instances/toggle
```

**Body:**
```json
{
  "instanceId": "uuid",
  "isActive": false
}
```

## 🚀 Como Usar

### 1. Configurar Campanha com Rotação

```javascript
// 1. Listar instâncias disponíveis
const instances = await fetch('/campaigns/instances/available');

// 2. Adicionar instâncias à campanha
await fetch('/campaigns/campaign-id/instances', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instanceIds: ['uuid1', 'uuid2', 'uuid3'],
    useRotation: true,
    rotationStrategy: 'RANDOM',
    maxMessagesPerInstance: 50
  })
});

// 3. Iniciar campanha (sem especificar instanceName)
await fetch('/campaigns/campaign-id/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Sua mensagem aqui',
    minDelay: 5,
    maxDelay: 30
  })
});
```

### 2. Monitorar Progresso

```javascript
// Verificar estatísticas das instâncias
const stats = await fetch('/campaigns/campaign-id/instances/stats');
const data = await stats.json();

console.log(`Total de mensagens enviadas: ${data.data.totalMessagesSent}`);
console.log(`Instâncias ativas: ${data.data.activeInstances}`);
```

## 🔄 Comportamento do Sistema

### Durante o Disparo

1. **Se `useRotation = true`**: O sistema automaticamente seleciona a próxima instância disponível baseada na estratégia configurada
2. **Se `useRotation = false`**: Usa a instância especificada em `instanceName` (comportamento tradicional)

### Seleção de Instância

- **RANDOM**: Escolhe aleatoriamente entre instâncias disponíveis
- **SEQUENTIAL**: Usa a instância que não foi usada há mais tempo
- **LOAD_BALANCED**: Escolhe a instância com menos mensagens enviadas

### Limites de Mensagens

- Se `maxMessagesPerInstance` for definido, a instância será "pausada" após atingir o limite
- O sistema automaticamente alterna para a próxima instância disponível
- Quando todas as instâncias atingem o limite, o disparo para

## ⚠️ Considerações Importantes

1. **Instâncias Conectadas**: Apenas instâncias com status `CONNECTED` são usadas
2. **Limite de Mensagens**: Configure limites realistas para evitar banimentos
3. **Delays**: Mantenha delays adequados entre mensagens (recomendado: 5-30 segundos)
4. **Monitoramento**: Monitore as estatísticas regularmente

## 🛠️ Troubleshooting

### Problema: "Nenhuma instância disponível"
**Solução:**
- Verifique se as instâncias estão conectadas
- Reset os contadores se necessário
- Adicione mais instâncias à campanha

### Problema: Instância não está sendo usada
**Solução:**
- Verifique se a instância está ativa (`isActive: true`)
- Confirme se não atingiu o limite de mensagens
- Verifique o status de conexão

### Problema: Rotação não está funcionando
**Solução:**
- Confirme que `useRotation: true` foi configurado
- Verifique se há múltiplas instâncias na campanha
- Monitore as estatísticas para confirmar o uso

## 📊 Exemplo de Fluxo Completo

```javascript
// 1. Criar campanha
const campaign = await createCampaign({
  name: "Campanha com Rotação",
  type: "mass"
});

// 2. Adicionar instâncias
await addInstancesToCampaign(campaign.id, {
  instanceIds: ["instance1", "instance2", "instance3"],
  useRotation: true,
  rotationStrategy: "RANDOM",
  maxMessagesPerInstance: 100
});

// 3. Importar leads
await importLeads(campaign.id, leadsData);

// 4. Iniciar campanha
await startCampaign(campaign.id, {
  message: "Olá! Esta é uma mensagem de teste.",
  minDelay: 10,
  maxDelay: 30
});

// 5. Monitorar progresso
setInterval(async () => {
  const stats = await getCampaignInstanceStats(campaign.id);
  console.log(`Progresso: ${stats.data.totalMessagesSent} mensagens enviadas`);
}, 30000);
```

Este sistema garante que suas campanhas sejam distribuídas de forma inteligente entre múltiplas instâncias, reduzindo significativamente o risco de banimentos do WhatsApp.
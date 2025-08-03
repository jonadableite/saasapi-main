# Teste de Grupos e Otimizações

## 🧪 Como Testar as Funcionalidades

### 1. **Teste de Conversas em Grupos**

#### Configuração para Teste de Grupos
```json
{
  "phoneInstances": [
    {
      "instanceId": "test-group-1",
      "phoneNumber": "5511999999999"
    }
  ],
  "contents": {
    "texts": [
      "Bom dia grupo!",
      "Como estão todos?",
      "Que dia lindo!",
      "Alguém aí?",
      "Tudo bem pessoal?",
      "Boa tarde grupo!",
      "Como foi o dia de vocês?",
      "Boa noite a todos!",
      "Até mais pessoal!",
      "Foi um prazer conversar!"
    ],
    "images": [],
    "audios": [],
    "videos": [],
    "stickers": [],
    "emojis": ["👍", "❤️", "👋", "🙏"]
  },
  "config": {
    "textChance": 1.0,
    "audioChance": 0.0,
    "reactionChance": 0.3,
    "stickerChance": 0.0,
    "imageChance": 0.0,
    "videoChance": 0.0,
    "minDelay": 5000,
    "maxDelay": 15000,
    "groupChance": 0.8,           // 80% chance de enviar para grupo
    "externalNumbersChance": 0.0,  // 0% chance de usar números externos
    "groupId": "120363419940617369@g.us",
    "typingSimulation": true,
    "onlineStatusSimulation": true,
    "readReceiptSimulation": true,
    "engagementOptimization": true,
    "messageQuality": "high"
  }
}
```

#### Logs Esperados para Grupos
```
[INFO] Score de engajamento: 75.2
[INFO] Timing otimizado: 3000ms
[INFO] Status online simulado para test-group-1
[INFO] Decidido enviar mensagem para grupo
[INFO] Simulando digitação para grupo...
[INFO] Enviando text para grupo
[INFO] Mensagem text enviada com sucesso
[INFO] Read receipt simulado para mensagem abc123
[INFO] Aguardando 8000ms antes da próxima mensagem (otimizado)...
```

### 2. **Teste de Números Externos**

#### Configuração para Teste de Números Externos
```json
{
  "phoneInstances": [
    {
      "instanceId": "test-external-1",
      "phoneNumber": "5511999999999"
    }
  ],
  "contents": {
    "texts": [
      "Oi! Tudo bem?",
      "Como vai?",
      "Que tal o dia?",
      "Tudo tranquilo?",
      "Bom dia!",
      "Boa tarde!",
      "Boa noite!"
    ],
    "images": [],
    "audios": [],
    "videos": [],
    "stickers": [],
    "emojis": ["👍", "❤️", "👋"]
  },
  "config": {
    "textChance": 1.0,
    "audioChance": 0.0,
    "reactionChance": 0.2,
    "stickerChance": 0.0,
    "imageChance": 0.0,
    "videoChance": 0.0,
    "minDelay": 8000,
    "maxDelay": 20000,
    "groupChance": 0.0,           // 0% chance de enviar para grupo
    "externalNumbersChance": 0.8,  // 80% chance de usar números externos
    "groupId": "120363419940617369@g.us",
    "typingSimulation": true,
    "engagementOptimization": true
  }
}
```

#### Logs Esperados para Números Externos
```
[INFO] Score de engajamento: 65.8
[INFO] Timing otimizado: 5000ms
[INFO] Decidido usar 3 números externos
[INFO] Simulando digitação para 5511999151515...
[INFO] Enviando text para 5511999151515
[INFO] Mensagem text enviada com sucesso
[INFO] Aguardando 8000ms antes da próxima mensagem (otimizado)...
```

### 3. **Teste de Otimizações Avançadas**

#### Configuração para Teste de Otimizações
```json
{
  "phoneInstances": [
    {
      "instanceId": "test-optimization-1",
      "phoneNumber": "5511999999999"
    }
  ],
  "contents": {
    "texts": [
      "Olá! Como vai?",
      "Tudo bem por aí?",
      "Que dia lindo!",
      "Como está o clima?"
    ],
    "images": [],
    "audios": [],
    "videos": [],
    "stickers": [],
    "emojis": ["👍", "❤️", "😂"]
  },
  "config": {
    "textChance": 1.0,
    "audioChance": 0.0,
    "reactionChance": 0.4,
    "stickerChance": 0.0,
    "imageChance": 0.0,
    "videoChance": 0.0,
    "minDelay": 3000,
    "maxDelay": 10000,
    "groupChance": 0.3,
    "externalNumbersChance": 0.4,
    "groupId": "120363419940617369@g.us",
    "typingSimulation": true,
    "onlineStatusSimulation": true,
    "readReceiptSimulation": true,
    "activeHours": { "start": 8, "end": 22 },
    "weekendBehavior": "normal",
    "autoReplyChance": 0.3,
    "replyDelay": { "min": 2000, "max": 10000 },
    "statusUpdateChance": 0.1,
    "statusTexts": ["Disponível", "Em reunião", "No trabalho"],
    "profileUpdateChance": 0.05,
    "profileNames": ["João Silva", "Maria Santos"],
    "profileBios": ["Desenvolvedor", "Analista"],
    "engagementOptimization": true,
    "messageQuality": "high"
  }
}
```

#### Logs Esperados para Otimizações
```
[INFO] Score de engajamento: 82.5
[INFO] Timing otimizado: 2000ms
[INFO] Status online simulado para test-optimization-1
[INFO] Decidido enviar mensagem para grupo
[INFO] Simulando digitação para grupo...
[INFO] Enviando text para grupo
[INFO] Mensagem text enviada com sucesso
[INFO] Read receipt simulado para mensagem abc123
[INFO] Aguardando 8000ms antes da próxima mensagem (otimizado)...
[INFO] Atualizando status para: Em reunião
[INFO] Atualizando perfil: João Silva - Desenvolvedor
```

## 🔍 Como Verificar se Está Funcionando

### 1. **Verificar Logs**
Procure por estas mensagens nos logs:
- ✅ `"Decidido enviar mensagem para grupo"`
- ✅ `"Decidido usar X números externos"`
- ✅ `"Score de engajamento: XX.X"`
- ✅ `"Timing otimizado: XXXXms"`
- ✅ `"Status online simulado"`
- ✅ `"Read receipt simulado"`

### 2. **Verificar Comportamento**
- **Grupos**: Mensagens sendo enviadas para o grupo configurado
- **Números Externos**: Mensagens sendo enviadas para números da lista
- **Otimizações**: Delays variando baseado no engajamento
- **Simulações**: Status online e read receipts sendo simulados

### 3. **Verificar Configurações**
```bash
# Verificar status do warmup
GET /api/warmup/status

# Verificar estatísticas detalhadas
GET /api/warmup/stats/{instanceId}
```

## ⚠️ Problemas Comuns e Soluções

### 1. **Grupos não funcionando**
- Verificar se a instância é membro do grupo
- Verificar se o `groupId` está correto
- Verificar se `groupChance` está > 0

### 2. **Números externos não funcionando**
- Verificar se `externalNumbersChance` está > 0
- Verificar se a lista de números está carregada

### 3. **Otimizações não aplicadas**
- Verificar se `engagementOptimization` está true
- Verificar se `typingSimulation` está true
- Verificar se `onlineStatusSimulation` está true

### 4. **Logs não aparecendo**
- Verificar se o nível de log está correto
- Verificar se as configurações estão sendo aplicadas
- Verificar se o warmup está ativo

## 📊 Métricas de Sucesso

### Indicadores de Funcionamento
- ✅ Mensagens sendo enviadas para grupos
- ✅ Mensagens sendo enviadas para números externos
- ✅ Delays variando baseado no engajamento
- ✅ Simulação de comportamento humano
- ✅ Atualizações de status e perfil
- ✅ Logs detalhados aparecendo

### Logs de Erro Comuns
- ❌ `"Erro ao enviar mensagem"`
- ❌ `"Limite diário atingido"`
- ❌ `"Usuário não encontrado"`
- ❌ `"Tipo de mensagem não permitido"`

## 🚀 Comandos para Testar

### 1. **Iniciar Warmup**
```bash
POST /api/warmup/configure
Content-Type: application/json

{
  // Configuração de teste aqui
}
```

### 2. **Verificar Status**
```bash
GET /api/warmup/status
```

### 3. **Parar Warmup**
```bash
POST /api/warmup/stop/{instanceId}
```

### 4. **Verificar Logs**
```bash
# Monitorar logs em tempo real
tail -f logs/warmup.log
```

## 🎯 Resultado Esperado

Se tudo estiver funcionando corretamente, você verá:

1. **Logs detalhados** mostrando decisões de grupo/números externos
2. **Mensagens sendo enviadas** para grupos e números externos
3. **Otimizações sendo aplicadas** (delays, engajamento, etc.)
4. **Simulações funcionando** (digitação, status, read receipts)
5. **Atualizações periódicas** de status e perfil

Se não estiver vendo esses comportamentos, verifique as configurações e logs de erro.
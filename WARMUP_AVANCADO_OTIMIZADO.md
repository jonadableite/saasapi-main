# Sistema de Warmup Avançado e Otimizado

## 🚀 Novas Funcionalidades Implementadas

### 1. **Tipos de Mensagem Avançados**
- ✅ **Documentos**: Envio de PDFs, documentos
- ✅ **Localização**: Compartilhamento de localização
- ✅ **Contatos**: Envio de cartões de visita
- ✅ **Enquetes**: Criação de votações
- ✅ **Status**: Atualização de status
- ✅ **Perfil**: Modificação de nome e bio

### 2. **Simulação de Comportamento Humano**
- ✅ **Digitação**: Simulação de tempo de digitação real
- ✅ **Status Online**: Simulação de presença online/offline
- ✅ **Read Receipts**: Marcação de mensagens como lidas
- ✅ **Delays Inteligentes**: Baseados no comprimento da mensagem

### 3. **Otimização Baseada em Horário**
- ✅ **Horários Ativos**: 8h às 22h (configurável)
- ✅ **Comportamento de Fim de Semana**: Reduzido ou desligado
- ✅ **Delays Dinâmicos**: Baseados no horário do dia
- ✅ **Pausas Inteligentes**: Durante madrugada

### 4. **Sistema de Engajamento**
- ✅ **Score de Engajamento**: Cálculo automático
- ✅ **Timing Otimizado**: Baseado no engajamento
- ✅ **Estratégias de Resposta**: Baseadas no histórico
- ✅ **Profundidade de Conversa**: Tracking automático

### 5. **Configurações de Segurança**
- ✅ **Modo Anti-Detecção**: Comportamento mais natural
- ✅ **Informações de Dispositivo Aleatórias**: Para maior segurança
- ✅ **Qualidade de Mensagem**: Configurável (baixa/média/alta)

## 📊 Configuração Avançada

### Exemplo de Configuração Completa
```json
{
  "phoneInstances": [
    {
      "instanceId": "instance1",
      "phoneNumber": "5511999999999"
    }
  ],
  "contents": {
    "texts": [
      "Olá! Como vai?",
      "Tudo bem por aí?",
      "Que dia lindo!",
      "Como está o clima?",
      "Bom dia!",
      "Boa tarde!",
      "Boa noite!"
    ],
    "images": [],
    "audios": [],
    "videos": [],
    "stickers": [],
    "emojis": ["👍", "❤️", "😂", "😮", "🙏"],
    "documents": [
      {
        "base64": "JVBERi0xLjQKJcOkw7zDtsO...",
        "fileName": "documento.pdf",
        "mimetype": "application/pdf",
        "caption": "Aqui está o documento"
      }
    ],
    "locations": [
      {
        "latitude": -23.5505,
        "longitude": -46.6333,
        "name": "São Paulo",
        "address": "São Paulo, SP, Brasil"
      }
    ],
    "contacts": [
      {
        "name": "João Silva",
        "number": "5511999999999",
        "email": "joao@email.com"
      }
    ],
    "polls": [
      {
        "question": "Qual sua cor favorita?",
        "options": ["Azul", "Vermelho", "Verde", "Amarelo"]
      }
    ]
  },
  "config": {
    "textChance": 0.35,
    "audioChance": 0.25,
    "reactionChance": 0.4,
    "stickerChance": 0.15,
    "imageChance": 0.08,
    "videoChance": 0.05,
    "documentChance": 0.03,
    "locationChance": 0.02,
    "contactChance": 0.02,
    "pollChance": 0.02,
    "minDelay": 3000,
    "maxDelay": 90000,
    "groupChance": 0.3,
    "externalNumbersChance": 0.4,
    "groupId": "120363419940617369@g.us",
    "externalNumbers": [],
    "typingSimulation": true,
    "onlineStatusSimulation": true,
    "readReceiptSimulation": true,
    "activeHours": {
      "start": 8,
      "end": 22
    },
    "weekendBehavior": "normal",
    "autoReplyChance": 0.3,
    "replyDelay": {
      "min": 2000,
      "max": 10000
    },
    "statusUpdateChance": 0.1,
    "statusTexts": [
      "Disponível",
      "Em reunião",
      "No trabalho",
      "Viajando"
    ],
    "profileUpdateChance": 0.05,
    "profileNames": [
      "João Silva",
      "Maria Santos",
      "Pedro Costa"
    ],
    "profileBios": [
      "Desenvolvedor de software",
      "Analista de marketing",
      "Consultor empresarial"
    ],
    "groupJoinChance": 0.02,
    "groupLeaveChance": 0.01,
    "groupInviteChance": 0.01,
    "mediaDownloadChance": 0.5,
    "mediaForwardChance": 0.2,
    "antiDetectionMode": false,
    "randomDeviceInfo": false,
    "messageQuality": "medium",
    "engagementOptimization": true
  }
}
```

## 🎯 Funcionalidades Específicas

### 1. **Simulação de Comportamento Humano**

#### Digitação Realista
```typescript
// Simula tempo de digitação baseado no comprimento
await this.humanBehaviorSimulator.simulateTyping(instanceId, target);
```

#### Status Online/Offline
```typescript
// Simula presença online
await this.humanBehaviorSimulator.simulateOnlineStatus(instanceId, 'online');
```

#### Read Receipts
```typescript
// Marca mensagem como lida
await this.humanBehaviorSimulator.simulateReadReceipt(instanceId, messageId);
```

### 2. **Otimização de Horário**

#### Verificação de Horário Ativo
```typescript
if (this.timeBasedScheduler.isActiveTime()) {
  // Enviar mensagem
}
```

#### Delays Baseados no Horário
```typescript
const delay = this.timeBasedScheduler.getOptimalDelay();
await this.delay(delay, delay + 1000);
```

### 3. **Sistema de Engajamento**

#### Cálculo de Score
```typescript
const score = await this.engagementOptimizer.calculateEngagementScore(instanceId);
```

#### Timing Otimizado
```typescript
const timing = await this.engagementOptimizer.optimizeMessageTiming(instanceId);
```

## 📈 Métricas e Estatísticas

### Novos Campos de Estatísticas
- `engagementScore`: Score de engajamento (0-100)
- `responseRate`: Taxa de resposta
- `averageResponseTime`: Tempo médio de resposta
- `conversationDepth`: Profundidade da conversa
- `groupParticipation`: Participação em grupos

### Tipos de Mensagem Expandidos
- `document`: Documentos enviados
- `location`: Localizações compartilhadas
- `contact`: Contatos enviados
- `poll`: Enquetes criadas
- `status`: Status atualizados
- `profile`: Perfis modificados
- `group_action`: Ações em grupos

## 🔧 Configurações de Qualidade

### Níveis de Qualidade
- **Baixa**: Mensagens simples, delays longos
- **Média**: Balanceamento entre naturalidade e eficiência
- **Alta**: Comportamento muito natural, delays otimizados

### Modo Anti-Detecção
- Delays mais longos e variados
- Comportamento mais imprevisível
- Menor frequência de mensagens
- Simulação mais realista

## 🎮 Exemplos de Uso

### 1. **Configuração para Alto Engajamento**
```json
{
  "config": {
    "engagementOptimization": true,
    "messageQuality": "high",
    "typingSimulation": true,
    "autoReplyChance": 0.8,
    "replyDelay": { "min": 1000, "max": 5000 }
  }
}
```

### 2. **Configuração para Segurança Máxima**
```json
{
  "config": {
    "antiDetectionMode": true,
    "randomDeviceInfo": true,
    "messageQuality": "low",
    "activeHours": { "start": 9, "end": 18 },
    "weekendBehavior": "reduced"
  }
}
```

### 3. **Configuração para Grupos**
```json
{
  "config": {
    "groupChance": 0.5,
    "groupJoinChance": 0.1,
    "groupInviteChance": 0.05,
    "groupParticipation": "very_active"
  }
}
```

## 📊 Monitoramento

### Logs Detalhados
```
[INFO] Simulando digitação para 5511999999999 por 2500ms
[INFO] Status online simulado para instance1
[INFO] Read receipt simulado para mensagem abc123
[INFO] Score de engajamento: 85.5
[INFO] Timing otimizado: 2000ms
[INFO] Enviando document para 5511999999999
[INFO] Mensagem document enviada com sucesso
```

### Métricas de Performance
- Taxa de entrega de mensagens
- Tempo médio de resposta
- Score de engajamento por instância
- Profundidade de conversa
- Participação em grupos

## 🚀 Benefícios

### 1. **Naturalidade**
- Comportamento mais humano
- Delays realistas
- Simulação de digitação
- Status online/offline

### 2. **Segurança**
- Modo anti-detecção
- Informações de dispositivo aleatórias
- Comportamento imprevisível
- Configurações de segurança

### 3. **Eficiência**
- Otimização baseada em horário
- Sistema de engajamento
- Timing inteligente
- Qualidade configurável

### 4. **Flexibilidade**
- Múltiplos tipos de mensagem
- Configurações granulares
- Comportamento personalizável
- Métricas detalhadas

## 🔮 Próximas Melhorias

### Planejadas
- [ ] IA para geração de conteúdo
- [ ] Análise de sentimento
- [ ] Integração com CRM
- [ ] Relatórios avançados
- [ ] Machine Learning para otimização

### Em Desenvolvimento
- [ ] Suporte a múltiplos idiomas
- [ ] Templates de mensagem
- [ ] Agendamento inteligente
- [ ] Integração com APIs externas
# Warmup com Grupos e Números Externos

## Novas Funcionalidades

### 1. Conversas em Grupos
O sistema agora suporta envio de mensagens para grupos do WhatsApp. Por padrão, usa o grupo com ID `120363419940617369@g.us`.

### 2. Números Externos
O sistema inclui uma lista de 150+ números externos para conversar, além das instâncias configuradas.

## Configuração

### Configurações Padrão
```json
{
  "config": {
    "groupChance": 0.3,           // 30% chance de enviar para grupo
    "externalNumbersChance": 0.4,  // 40% chance de usar números externos
    "groupId": "120363419940617369@g.us", // ID do grupo padrão
    "externalNumbers": []          // Lista opcional de números externos adicionais
  }
}
```

### Exemplo de Configuração Completa
```json
{
  "phoneInstances": [
    {
      "instanceId": "instance1",
      "phoneNumber": "5511999999999"
    },
    {
      "instanceId": "instance2",
      "phoneNumber": "5511888888888"
    }
  ],
  "contents": {
    "texts": ["Olá!", "Como vai?", "Tudo bem?"],
    "images": [...],
    "audios": [...],
    "videos": [...],
    "stickers": [...],
    "emojis": ["👍", "❤️", "😂"]
  },
  "config": {
    "textChance": 0.8,
    "audioChance": 0.3,
    "reactionChance": 0.4,
    "stickerChance": 0.2,
    "imageChance": 0.3,
    "videoChance": 0.1,
    "minDelay": 3000,
    "maxDelay": 90000,
    "groupChance": 0.3,           // 30% chance de enviar para grupo
    "externalNumbersChance": 0.4,  // 40% chance de usar números externos
    "groupId": "120363419940617369@g.us",
    "externalNumbers": []          // Opcional: números adicionais
  }
}
```

## Como Funciona

### 1. Decisão de Destino
A cada ciclo de mensagem, o sistema decide:
- **Grupo vs Privado**: Baseado em `groupChance` (30% padrão)
- **Números Externos vs Instâncias**: Baseado em `externalNumbersChance` (40% padrão)

### 2. Fluxo de Decisão
```
1. É mensagem para grupo? (30% chance)
   ├─ Sim: Envia para o grupo configurado
   └─ Não: Vai para passo 2

2. Usar números externos? (40% chance)
   ├─ Sim: Seleciona 1-3 números da lista externa
   └─ Não: Usa instâncias configuradas
```

### 3. Lista de Números Externos
O sistema inclui automaticamente 150+ números brasileiros para conversar:
- 5511999151515
- 553123320005
- 5511956860124
- ... (e mais 147 números)

## Comportamento

### Simulação Humana
- **Grupos**: Simula digitação/gravação mais lenta
- **Números Externos**: Seleciona apenas 1-3 números por ciclo
- **Delays**: Mantém delays aleatórios entre mensagens

### Logs
O sistema registra:
```
Simulando digitação para grupo...
Enviando text para grupo
Mensagem text enviada com sucesso

Simulando digitação para 5511999151515...
Enviando text para 5511999151515
Mensagem text enviada com sucesso
```

## Vantagens

1. **Maior Diversidade**: Conversas com números externos além das instâncias
2. **Atividade em Grupos**: Participação em grupos para maior naturalidade
3. **Configurável**: Chances ajustáveis via configuração
4. **Seguro**: Mantém limites diários e verificações de plano

## Limitações

- Números externos são apenas para envio (não recebem respostas)
- Grupo deve existir e instâncias devem ser membros
- Respeita limites diários do plano do usuário
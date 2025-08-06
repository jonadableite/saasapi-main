# Funcionalidades de Grupos e Números Externos

## 🚀 Novas Funcionalidades Implementadas

### 1. **Conversas em Grupos**
O sistema agora suporta envio de mensagens para grupos do WhatsApp. Por padrão, usa o grupo com ID `120363419940617369@g.us`.

### 2. **Números Externos**
O sistema inclui uma lista de 150+ números externos para conversar, além das instâncias configuradas.

## 📋 Lista de Números Externos

O sistema inclui automaticamente os seguintes números brasileiros:
- 5511999151515
- 553123320005
- 5511956860124
- 551134748029
- 551155728778
- 5521993153062
- 554832433664
- 551128530702
- 554791107025
- 551128530762
- 5511937577552
- 5521994017240
- 557532216114
- 5511972146733
- 5511915862328
- 559230421437
- 555133825500
- 5511934505884
- 5511975295195
- 5511912609190
- 5511994304972
- 5511939036857
- 551126265327
- 551131552800
- 555599897514
- 554732373771
- 551940421800
- 558534866366
- 555433176300
- 558007274660
- 5511976664900
- 5511986293294
- 5511934819317
- 558881822574
- 551156130202
- 551132300363
- 5511915828037
- 551821018311
- 551130422170
- 555133143838
- 558140043050
- 558006661515
- 551121098888
- 552135909000
- 551128530325
- 551132301493
- 555133343432
- 558140043230
- 5521993410670
- 5511941836701
- 5511940646175
- 5511941536754
- 558000207758
- 558001040104
- 552120423829
- 551130048007
- 5511944469719
- 551133452288
- 5519983630058
- 552721247700
- 553183386125
- 5511963785460
- 556135224521
- 551131354148
- 5521981281045
- 558002320800
- 5511955581462
- 552134601746
- 551140644106
- 554195053843
- 551151999851
- 551142008293
- 551142000252
- 5511943323273
- 5511973079915
- 5511993428075
- 551150621456
- 555433270042
- 558340629108
- 553133849008
- 552138121921
- 5511943079112
- 5511911875504
- 551148390436
- 558331422688
- 5511988952656
- 5521980090636
- 551135223406
- 551935006321
- 557182197732
- 551131985816
- 551131360110
- 5511972888604
- 5511934687141
- 5511943396419
- 558007442110
- 551142000355
- 553432576000
- 5511976216004
- 555191490457
- 5521991776152
- 5511933505743
- 5511988913555
- 5511945382314
- 553198780286
- 551132322935
- 5511942114304
- 558001488000
- 552139007070
- 551151963400
- 553132612801
- 558000550073
- 558007268010
- 551150439404
- 551130037242
- 5521967446767
- 5511976379870
- 5521965247184
- 551137249000
- 5511944882022
- 5511975691546
- 5511964146890
- 5511913185864
- 5511999910621
- 556140040001
- 551140201955
- 5521973015191

## ⚙️ Configuração

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

## 🔄 Como Funciona

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

### 3. Comportamento Específico

#### Grupos
- Simula digitação/gravação mais lenta
- Delays mais longos para maior naturalidade
- Não envia reações (apenas mensagens)

#### Números Externos
- Seleciona apenas 1-3 números por ciclo
- Mantém delays aleatórios entre mensagens
- Números externos são apenas para envio (não recebem respostas)

## 📊 Logs de Exemplo

```
Simulando digitação para grupo...
Enviando text para grupo
Mensagem text enviada com sucesso para grupo

Simulando digitação para 5511999151515...
Enviando text para 5511999151515
Mensagem text enviada com sucesso
```

## 🎯 Vantagens

1. **Maior Diversidade**: Conversas com números externos além das instâncias
2. **Atividade em Grupos**: Participação em grupos para maior naturalidade
3. **Configurável**: Chances ajustáveis via configuração
4. **Seguro**: Mantém limites diários e verificações de plano

## ⚠️ Limitações

- Números externos são apenas para envio (não recebem respostas)
- Grupo deve existir e instâncias devem ser membros
- Respeita limites diários do plano do usuário

## 🔧 Personalização

### Adicionar Números Externos Customizados
```json
{
  "config": {
    "externalNumbers": [
      "5511999999999",
      "5511888888888",
      "5511777777777"
    ]
  }
}
```

### Alterar Grupo Padrão
```json
{
  "config": {
    "groupId": "120363419940617369@g.us"
  }
}
```

### Ajustar Probabilidades
```json
{
  "config": {
    "groupChance": 0.5,           // 50% chance de enviar para grupo
    "externalNumbersChance": 0.6   // 60% chance de usar números externos
  }
}
```

## 📈 Monitoramento

O sistema registra todas as atividades:
- Mensagens enviadas para grupos
- Mensagens enviadas para números externos
- Estatísticas de uso por tipo de destino
- Logs detalhados para debugging

## 🚀 Próximas Melhorias

- [ ] Suporte a múltiplos grupos
- [ ] Configuração de horários específicos para grupos
- [ ] Integração com APIs de grupos
- [ ] Relatórios avançados de atividade em grupos
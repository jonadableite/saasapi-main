# Configuração do Hotmart - Variáveis de Ambiente

Para que a integração com o Hotmart funcione corretamente, você precisa adicionar as seguintes variáveis ao seu arquivo `.env`:

## Variáveis Obrigatórias

```env
# Hotmart API Credentials
HOTMART_CLIENT_ID="5061caa5-5f20-4182-8209-f26778631bdc"
HOTMART_CLIENT_SECRET="88caa76c-4bc6-4985-bc34-2838cc76c7ef"

# Hotmart Webhook Token (HOTTOK)
# Este token é fornecido pela Hotmart quando você configura o webhook
# Você pode encontrá-lo na plataforma Hotmart em: Ferramentas > Webhooks
HOTMART_WEBHOOK_TOKEN="seu_hottok_aqui"
```

## Como Obter o HOTMART_WEBHOOK_TOKEN

1. Acesse a plataforma Hotmart
2. Vá em **Ferramentas > Webhooks**
3. Crie uma nova configuração de webhook:
   - **Nome**: WhatLead
   - **Produto**: Whatlead - Disparos
   - **URL**: `https://aquecerapi.whatlead.com.br/api/hotmart/webhook/user`
   - **Versão**: 2.0.0
   - **Eventos**: Todos os 13 eventos selecionados
4. Após criar o webhook, você receberá um token (HOTTOK)
5. Copie esse token e adicione como valor da variável `HOTMART_WEBHOOK_TOKEN`

## Configuração Atual do Usuário

Baseado no seu arquivo .env atual, você precisa adicionar apenas:

```env
HOTMART_WEBHOOK_TOKEN="seu_hottok_aqui"
```

Substitua `"seu_hottok_aqui"` pelo token real fornecido pela Hotmart.

## Teste da Integração

Após adicionar a variável `HOTMART_WEBHOOK_TOKEN`, reinicie o servidor e teste a integração. O erro 401 deve ser resolvido e os webhooks do Hotmart devem funcionar corretamente.
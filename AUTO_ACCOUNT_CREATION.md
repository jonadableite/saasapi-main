# Sistema de Criação Automática de Contas

Este documento explica como funciona o sistema de criação automática de contas quando pagamentos são confirmados na plataforma.

## 🚀 Visão Geral

O sistema foi projetado para criar automaticamente contas de usuário quando:
- Uma nova assinatura é confirmada via Hotmart
- Um pagamento é processado via Stripe
- Uma conta é criada manualmente por administradores

## 📋 Funcionalidades Principais

### 1. **Criação Automática via Hotmart**
- Quando uma compra é aprovada na Hotmart, o webhook `PURCHASE_APPROVED` é processado
- O sistema verifica se já existe um usuário com o email do comprador
- Se não existir, cria automaticamente:
  - Uma empresa para o usuário
  - Uma conta de usuário com senha inicial (email)
  - Configura o plano baseado no valor da assinatura
  - Envia email de boas-vindas com dados de acesso

### 2. **Configuração de Planos**
O sistema determina automaticamente o plano baseado no valor do pagamento:

| Valor | Plano | Instâncias | Mensagens/Dia | Recursos |
|-------|-------|------------|---------------|----------|
| R$ 0-48 | Free | 1 | 20 | TEXT |
| R$ 49-96 | Basic | 2 | 50 | TEXT, IMAGE |
| R$ 97-298 | Pro | 5 | 100 | TEXT, IMAGE, VIDEO, AUDIO |
| R$ 299+ | Scale | 15 | 500 | TEXT, IMAGE, VIDEO, AUDIO, STICKER |

### 3. **Email de Boas-vindas**
O sistema envia automaticamente um email com:
- Dados de acesso para todas as plataformas
- URLs de login
- Informações de suporte
- Recomendações de segurança

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# SMTP para envio de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
SMTP_SENDER_EMAIL=noreply@whatlead.com.br

# Hotmart Webhook
HOTMART_WEBHOOK_TOKEN=seu_hottok_aqui

# WhatsApp API (para mensagens de boas-vindas)
WHATSAPP_API_KEY=429683C4C977415CAAFCCE10F7D57E11
WHATSAPP_BASE_URL=https://evo.whatlead.com.br
```

## 📡 Endpoints da API

### Criação Manual (Admin)
```
POST /api/auto-account/create
```
Cria uma conta manualmente (apenas para administradores).

**Body:**
```json
{
  "customerEmail": "cliente@exemplo.com",
  "customerName": "Nome do Cliente",
  "customerPhone": "+5511999999999",
  "paymentValue": 97.00,
  "paymentStatus": "APPROVED",
  "subscriptionStatus": "ACTIVE",
  "source": "manual"
}
```

### Verificação de Conta
```
GET /api/auto-account/check/:email
```
Verifica se uma conta existe no sistema.

### Informações da Conta
```
GET /api/auto-account/account/:email
```
Obtém informações detalhadas de uma conta.

### Reenvio de Boas-vindas
```
POST /api/auto-account/resend-welcome/:email
```
Reenvia o email de boas-vindas para um usuário.

## 🔄 Fluxo de Processamento

### 1. **Recebimento de Webhook Hotmart**
```
Hotmart → Webhook → Validação → Processamento → Criação de Conta
```

### 2. **Criação de Conta**
```
Verificar Email → Criar Empresa → Criar Usuário → Configurar Plano → Enviar Boas-vindas
```

### 3. **Configuração Automática**
- **Empresa**: Criada com nome personalizado
- **Usuário**: Criado com senha inicial (email)
- **Plano**: Determinado pelo valor do pagamento
- **Limites**: Configurados automaticamente
- **Acesso**: Liberado imediatamente

## 📊 Estrutura do Banco de Dados

### Tabelas Envolvidas

#### `whatlead_users`
- Dados do usuário criado
- Plano e limites configurados
- Relacionamento com empresa

#### `whatlead_companies`
- Empresa criada para o usuário
- Configurações básicas

#### `hotmart_customers`
- Dados do cliente Hotmart
- Relacionamento com usuário Whatlead
- Histórico de transações

## 🛡️ Segurança

### Validações Implementadas
- Verificação de email único
- Validação de dados obrigatórios
- Controle de acesso por role
- Logs detalhados de todas as operações

### Tratamento de Erros
- Falhas não interrompem o fluxo principal
- Logs detalhados para debugging
- Retry automático para operações críticas

## 📈 Monitoramento

### Logs Importantes
- Criação de contas
- Envio de emails
- Erros de processamento
- Atualizações de plano

### Métricas Disponíveis
- Contas criadas por período
- Taxa de sucesso de criação
- Tempo médio de processamento
- Erros por tipo

## 🔧 Manutenção

### Comandos Úteis

```bash
# Verificar logs de criação de contas
grep "criação automática" logs/app.log

# Verificar emails enviados
grep "boas-vindas" logs/app.log

# Verificar erros
grep "erro" logs/app.log
```

### Troubleshooting

1. **Email não enviado**: Verificar configurações SMTP
2. **Conta não criada**: Verificar logs de erro
3. **Plano incorreto**: Verificar lógica de determinação
4. **Webhook não processado**: Verificar token Hotmart

## 🚀 Próximos Passos

### Melhorias Planejadas
- [ ] Integração com Stripe
- [ ] Notificações push
- [ ] Dashboard de monitoramento
- [ ] Relatórios automáticos
- [ ] Integração com WhatsApp Business API

### Funcionalidades Futuras
- [ ] Criação em lote
- [ ] Templates personalizados
- [ ] Integração com CRM
- [ ] Automação avançada
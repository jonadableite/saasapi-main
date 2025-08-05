# Sistema de Gerenciamento de Clientes Hotmart

Este documento detalha a implementação completa do sistema de gerenciamento de clientes que assinam a plataforma através da Hotmart.

## 🚀 Visão Geral

O sistema implementa uma solução robusta para gerenciar clientes Hotmart de forma automática, eficiente e inteligente, permitindo análises detalhadas e automações completas.

## 📋 Funcionalidades Principais

### 1. **Webhook Integration**
- Recebimento automático de eventos da Hotmart
- Processamento em tempo real de 13 tipos de eventos
- Validação de segurança com hottok
- Retry automático para eventos falhados

### 2. **API Integration**
- Autenticação OAuth 2.0 com a API Hotmart
- Sincronização bidirecional de dados
- Enriquecimento automático de informações
- Gerenciamento de assinaturas via API

### 3. **Automação Inteligente**
- Criação automática de usuários no sistema Whatlead
- Envio de boas-vindas personalizadas (email + WhatsApp)
- Bloqueio/liberação automática de acesso
- Processamento de eventos em background

### 4. **Análise e Relatórios**
- Métricas de churn em tempo real
- Análise de receita recorrente (MRR/ARR)
- Segmentação de clientes
- Exportação de dados em CSV

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `hotmart_customers`
Armazena todos os dados dos clientes Hotmart:
- Informações pessoais e de contato
- Dados de assinatura e pagamento
- Status e histórico de atividades
- Relacionamento com usuários Whatlead

#### `hotmart_events`
Registra todos os eventos recebidos via webhook:
- Tipo e dados do evento
- Status de processamento
- Contador de tentativas
- Timestamps de processamento

#### `hotmart_transactions`
Histórico completo de transações:
- Dados de pagamento
- Informações de comissões
- Status de cada transação
- Relacionamento com clientes

#### `hotmart_analytics`
Métricas agregadas para análise:
- Receita por período
- Taxa de churn
- Assinaturas ativas/inativas
- Dados para relatórios

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Hotmart API Credentials
HOTMART_CLIENT_ID=seu_client_id_aqui
HOTMART_CLIENT_SECRET=seu_client_secret_aqui
HOTMART_WEBHOOK_TOKEN=seu_hottok_aqui

# SMTP Configuration (para emails de boas-vindas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
SMTP_SENDER_EMAIL=noreply@whatlead.com.br
```

### 2. Configuração do Webhook na Hotmart

1. Acesse a plataforma Hotmart
2. Vá em **Ferramentas > Webhooks**
3. Crie uma nova configuração:
   - **Nome**: WhatLead
   - **Produto**: Whatlead - Disparos
   - **URL**: `https://aquecerapi.whatlead.com.br/api/hotmart/webhook/user`
   - **Versão**: 2.0.0
   - **Eventos**: Todos os 13 eventos selecionados

### 3. Migração do Banco de Dados

Execute a migração do Prisma para criar as novas tabelas:

```bash
npx prisma migrate dev --name add_hotmart_tables
```

## 📡 Endpoints da API

### Webhook (Público)
```
POST /api/hotmart/webhook/user
```
Recebe eventos da Hotmart e processa automaticamente.

### Clientes (Protegido)
```
GET    /api/hotmart/customers              # Lista clientes
GET    /api/hotmart/customers/stats        # Estatísticas
GET    /api/hotmart/customers/:id          # Cliente específico
PUT    /api/hotmart/customers/:id          # Atualiza cliente
```

### Eventos e Transações
```
GET /api/hotmart/customers/:customerId/events       # Eventos do cliente
GET /api/hotmart/customers/:customerId/transactions # Transações do cliente
```

### Assinaturas
```
GET    /api/hotmart/subscriptions                    # Lista assinaturas
GET    /api/hotmart/subscriptions/:subscriberCode    # Detalhes da assinatura
POST   /api/hotmart/subscriptions/:subscriberCode/cancel     # Cancela assinatura
POST   /api/hotmart/subscriptions/:subscriberCode/reactivate # Reativa assinatura
```

### Sincronização
```
POST /api/hotmart/sync                # Sincroniza com Hotmart
```

### Notas e Tags
```
POST   /api/hotmart/customers/:customerId/notes     # Adiciona notas
POST   /api/hotmart/customers/:customerId/tags      # Adiciona tags
DELETE /api/hotmart/customers/:customerId/tags      # Remove tags
```

### Exportação e Relatórios
```
POST /api/hotmart/export              # Exporta dados
GET  /api/hotmart/analytics/report    # Relatório de análise
```

## 🔄 Jobs Automatizados

### 1. **Sincronização Diária** (2h da manhã)
- Sincroniza dados com a API da Hotmart
- Atualiza status de assinaturas
- Identifica novos clientes

### 2. **Processamento de Eventos** (a cada 30 minutos)
- Processa eventos pendentes
- Retry automático para falhas
- Atualiza status de processamento

### 3. **Análise de Churn** (domingos às 3h)
- Calcula taxa de churn semanal
- Identifica clientes em risco
- Gera relatórios de retenção

### 4. **Limpeza de Dados** (primeiro dia do mês às 4h)
- Remove eventos antigos processados
- Arquivar clientes cancelados
- Otimiza performance do banco

## 📊 Eventos Processados

### Compras
- ✅ **PURCHASE_APPROVED** - Compra aprovada
- ✅ **PURCHASE_CANCELLED** - Compra cancelada
- ✅ **PURCHASE_REFUNDED** - Compra reembolsada
- ✅ **PURCHASE_EXPIRED** - Compra expirada
- ✅ **PURCHASE_DELAYED** - Compra atrasada

### Assinaturas
- ✅ **SUBSCRIPTION_CANCELLED** - Cancelamento de assinatura
- ✅ **SUBSCRIPTION_CHANGED** - Troca de plano
- ✅ **SUBSCRIPTION_BILLING_DATE_UPDATED** - Atualização de data de cobrança

### Outros
- ✅ **CHARGEBACK** - Chargeback
- ✅ **CART_ABANDONED** - Abandono de carrinho

## 🎯 Fluxo de Processamento

### 1. **Recebimento de Webhook**
```
Hotmart → Webhook → Validação → Registro → Processamento
```

### 2. **Criação de Cliente**
```
Evento PURCHASE_APPROVED → Criação de cliente → Enriquecimento → Boas-vindas
```

### 3. **Enriquecimento de Dados**
```
Dados básicos → API Hotmart → Dados completos → Atualização
```

### 4. **Automação de Acesso**
```
Cliente criado → Usuário Whatlead → Acesso liberado → Notificação
```

## 📈 Métricas e Análises

### KPIs Principais
- **Total de Clientes**: Número total de clientes ativos
- **Taxa de Churn**: Percentual de cancelamentos
- **MRR (Monthly Recurring Revenue)**: Receita recorrente mensal
- **LTV (Lifetime Value)**: Valor do cliente ao longo do tempo
- **Taxa de Conversão**: Abandono de carrinho vs compras

### Segmentação de Clientes
- **Ativos**: Assinaturas em dia
- **Em Risco**: Pagamentos atrasados
- **Cancelados**: Assinaturas canceladas
- **Trial**: Período de teste

## 🔒 Segurança

### Validação de Webhook
- Verificação do hottok no cabeçalho `X-HOTMART-HOTTOK`
- Rejeição de requisições não autenticadas
- Log de tentativas de acesso não autorizado

### Autenticação de API
- OAuth 2.0 com refresh automático de token
- Rate limiting para evitar sobrecarga
- Retry com backoff exponencial

### Proteção de Dados
- Criptografia de senhas
- Logs de auditoria
- Backup automático de dados críticos

## 🚨 Monitoramento

### Logs Importantes
- Processamento de webhooks
- Erros de sincronização
- Tentativas de retry
- Criação de usuários

### Alertas Recomendados
- Falha na sincronização diária
- Taxa de churn acima do esperado
- Erros consecutivos de webhook
- Queda na receita recorrente

## 🔧 Manutenção

### Backup
- Backup diário das tabelas Hotmart
- Retenção de 30 dias de logs
- Backup de configurações

### Limpeza
- Remoção de eventos antigos (1 ano)
- Arquivamento de clientes cancelados
- Otimização de índices

### Atualizações
- Monitoramento de mudanças na API Hotmart
- Atualização de schemas conforme necessário
- Testes de compatibilidade

## 📞 Suporte

Para dúvidas ou problemas:

1. **Logs**: Verifique os logs do sistema
2. **Documentação**: Consulte este README
3. **API**: Teste os endpoints via Swagger (`/doc`)
4. **Suporte**: Entre em contato com a equipe técnica

## 🎉 Próximos Passos

1. **Configurar variáveis de ambiente**
2. **Executar migração do banco**
3. **Configurar webhook na Hotmart**
4. **Testar endpoints da API**
5. **Monitorar logs e métricas**
6. **Configurar alertas**

---

**Sistema desenvolvido para automatizar e otimizar o gerenciamento de clientes Hotmart na plataforma Whatlead.**
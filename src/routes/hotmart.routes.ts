// src/routes/hotmart.routes.ts
import { Router } from 'express';
import { hotmartController } from '../controllers/hotmart.controller';
import { authMiddleware } from '../middlewares/authenticate';
import { checkRole } from '../middlewares/roleCheck';

const router = Router();

// Rotas públicas (webhooks)
router.post('/webhook/user', hotmartController.handleWebhook);

// Rotas protegidas (requerem autenticação)
router.use(authMiddleware);

// Rotas de clientes
router.get('/customers', checkRole(['admin', 'manager']), hotmartController.getCustomers);
router.get('/customers/stats', checkRole(['admin', 'manager']), hotmartController.getCustomerStats);
router.get('/customers/:id', checkRole(['admin', 'manager']), hotmartController.getCustomer);
router.put('/customers/:id', checkRole(['admin', 'manager']), hotmartController.updateCustomer);

// Rotas de eventos e transações
router.get('/customers/:customerId/events', checkRole(['admin', 'manager']), hotmartController.getCustomerEvents);
router.get('/customers/:customerId/transactions', checkRole(['admin', 'manager']), hotmartController.getCustomerTransactions);

// Rotas de assinaturas
router.get('/subscriptions', checkRole(['admin', 'manager']), hotmartController.listSubscriptions);
router.get('/subscriptions/:subscriberCode', checkRole(['admin', 'manager']), hotmartController.getSubscriptionDetails);
router.post('/subscriptions/:subscriberCode/cancel', checkRole(['admin']), hotmartController.cancelSubscription);
router.post('/subscriptions/:subscriberCode/reactivate', checkRole(['admin']), hotmartController.reactivateSubscription);

// Rotas de sincronização
router.post('/sync', checkRole(['admin']), hotmartController.syncWithHotmart);

// Rotas de notas e tags
router.post('/customers/:customerId/notes', checkRole(['admin', 'manager']), hotmartController.addCustomerNote);
router.post('/customers/:customerId/tags', checkRole(['admin', 'manager']), hotmartController.addCustomerTags);
router.delete('/customers/:customerId/tags', checkRole(['admin', 'manager']), hotmartController.removeCustomerTags);

// Rotas de exportação e relatórios
router.post('/export', checkRole(['admin', 'manager']), hotmartController.exportCustomers);
router.get('/analytics/report', checkRole(['admin', 'manager']), hotmartController.generateAnalyticsReport);

export default router;
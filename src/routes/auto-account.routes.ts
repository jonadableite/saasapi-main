// src/routes/auto-account.routes.ts
import { Router } from 'express';
import { autoAccountController } from '../controllers/auto-account.controller';
import { authMiddleware } from '../middlewares/authenticate';
import { checkRole } from '../middlewares/roleCheck';

const router = Router();

// Rotas protegidas (requerem autenticação e role de admin)
router.use(authMiddleware);
router.use(checkRole(['admin']));

// Criar conta manualmente
router.post('/create', autoAccountController.createAccountManually);

// Verificar se conta existe
router.get('/check/:email', autoAccountController.checkAccountExists);

// Obter informações da conta por email
router.get('/account/:email', autoAccountController.getAccountByEmail);

// Reenviar email de boas-vindas
router.post('/resend-welcome/:email', autoAccountController.resendWelcomeEmail);

export default router;
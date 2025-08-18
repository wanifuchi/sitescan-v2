import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();
const adminController = new AdminController();

// 公開エンドポイント（認証不要）
router.post('/login', adminController.login.bind(adminController));

// 認証が必要なエンドポイント
router.use(authenticateAdmin); // 以下のルートにはすべて認証が必要

router.get('/validate', adminController.validateToken.bind(adminController));
router.get('/stats', adminController.getAnalysisStats.bind(adminController));
router.get('/analysis/:id', adminController.getAnalysisById.bind(adminController));
router.delete('/analysis/:id', adminController.deleteAnalysis.bind(adminController));
router.get('/export', adminController.exportAllData.bind(adminController));

export default router;
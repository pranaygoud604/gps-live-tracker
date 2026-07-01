import { Router } from 'express';
import {
  getDrivers, getOnlineDrivers, getStats, getDriverList,
  createDriver, updateDriver, deleteDriver,
} from '../controllers/driverController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getDrivers);
router.get('/online', getOnlineDrivers);
router.get('/stats', getStats);
router.get('/list', getDriverList);
router.post('/', createDriver);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

export default router;

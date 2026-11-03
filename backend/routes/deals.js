const router = require('express').Router();
const { getDeals, getDeal, createDeal, updateDeal, deleteDeal } = require('../controllers/deals');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    getDeals);
router.get('/:id', getDeal);
router.post('/',   createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteDeal);

module.exports = router;

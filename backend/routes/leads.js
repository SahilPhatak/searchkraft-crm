const router = require('express').Router();
const { getLeads, getLead, createLead, updateLead, deleteLead } = require('../controllers/leads');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    getLeads);
router.get('/:id', getLead);
router.post('/',   createLead);
router.put('/:id', updateLead);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteLead);

module.exports = router;

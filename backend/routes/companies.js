const router = require('express').Router();
const { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } = require('../controllers/companies');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    getCompanies);
router.get('/:id', getCompany);
router.post('/',   createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteCompany);

module.exports = router;

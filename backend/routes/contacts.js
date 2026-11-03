const router = require('express').Router();
const { getContacts, getContact, createContact, updateContact, deleteContact } = require('../controllers/contacts');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    getContacts);
router.get('/:id', getContact);
router.post('/',   createContact);
router.put('/:id', updateContact);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteContact);

module.exports = router;

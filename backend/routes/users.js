const router = require('express').Router();
const { getUsers, getUser, createUser, updateUser } = require('../controllers/users');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    requireRole('ADMIN', 'MANAGER'), getUsers);
router.get('/:id', getUser);
router.post('/',   requireRole('ADMIN'), createUser);
router.put('/:id', updateUser);

module.exports = router;

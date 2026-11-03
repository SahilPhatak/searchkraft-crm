const router = require('express').Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/tasks');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    getTasks);
router.get('/:id', getTask);
router.post('/',   createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;

const router = require('express').Router();
const { getActivities, createActivity, deleteActivity } = require('../controllers/activities');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    getActivities);
router.post('/',   createActivity);
router.delete('/:id', deleteActivity);

module.exports = router;

const router = require('express').Router();
const { getDashboard, getLeaderboard, getAnomaly } = require('../controllers/reports');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard',   getDashboard);
router.get('/leaderboard', getLeaderboard);
router.get('/anomaly',     getAnomaly);

module.exports = router;

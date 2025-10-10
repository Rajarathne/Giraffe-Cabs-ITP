const express = require('express');
const router = express.Router();
const { getDistance } = require('../Controllers/utilsController');

// Public endpoint to calculate driving distance between two addresses
router.get('/distance', getDistance);

module.exports = router;



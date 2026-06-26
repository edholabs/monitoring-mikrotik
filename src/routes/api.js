const express = require('express');
const router = express.Router();
const monitorController = require('../controllers/monitorController.js');

// Definisikan Endpoint API
router.get('/resource', monitorController.getSystemResource);
router.get('/traffic/:interfaceName', monitorController.getInterfaceTraffic);
router.get('/pppoe/active', monitorController.getPPPoEActive);

module.exports = router;
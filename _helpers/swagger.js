const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'swagger.json'), 'utf8')
);

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

module.exports = router;

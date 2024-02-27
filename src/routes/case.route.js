const express = require('express');
const authController = require('../controllers/auth.controller');
const caseController = require('../controllers/cases.controller')

const router = express()

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/getcases", caseController.getAll)

router.get("/getcase/:id", caseController.getCase)

// Protect all routes after this middleware
router.use(authController.restrict('Admin'));

router.get("/", caseController.ping)

router.post("/postcase",  caseController.postCase)

router.put("/editcase/:id", caseController.editCase)

router.delete("/deletecase/:id",caseController.deleteCase)

module.exports = router;
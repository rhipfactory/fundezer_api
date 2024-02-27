const express = require('express');
const campaignController = require("../controllers/campaign.controller")
const authController = require('../controllers/auth.controller');

const router = express()

router.get("/getcampaigns", campaignController.getAll)

router.get("/getcampaign/:id", campaignController.getCampaign)

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/", campaignController.ping)

router.get('/allrequest', campaignController.getAllReuqest)

router.patch('/approve/:requestId', campaignController.updateWithdrawalRequestStatus)

router.post('/request/:campaignId', campaignController.createWithdrawalRequest)

router.get("/getallcomments", campaignController.GetComments)

router.post("/postcampaign" ,campaignController.postCampaign)

router.post("/postcomment" ,campaignController.createComment)

router.post("/postdraft/:campaignId", campaignController.postSavedDraftCampaign)

router.get("/campaigns", campaignController.getBasedOnTime)

router.get("/campaign", campaignController.getCampaignByStatus)

router.patch('/close/:id',  campaignController.closeCampaign);

router.delete("/deletecampaign/:id", authController.restrict('Admin') ,campaignController.deleteCampaign)

module.exports = router;
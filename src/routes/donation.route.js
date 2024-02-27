const express = require('express');
const donationController = require("../controllers/donation.controller")
const authController = require('../controllers/auth.controller');

const router = express()


router.put("/visitordonation/:campaignId" , donationController.visitorDonation)

router.post("/verify/visitor", donationController.verifyVis)

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/", donationController.ping)

router.get("/getdonations", donationController.getAll)

router.get("/donations", donationController.getBasedOnTime)

router.put("/postdonations/:campaignId" , donationController.makeDonation)

router.put("/postdonationcase/:caseId" , donationController.makeDonationCase)

router.post("/verify", donationController.verify)

router.post("/verify/case", donationController.verifyCase)

router.post("/recurring/:campaignId" , donationController.makeRecurringDonation)

router.get("/getdonation/:id", donationController.getDonation)

router.get("/total/:userId", donationController.getTotalDonationsByUser)

router.get("/users/:userId/cases/:caseId/donations/total", donationController.getTotalDonationsByUserAndCase)

router.get("/users/:userId/campaign/:campaignId/donations/total", donationController.getTotalDonationsByUserAndCampagin)

router.get("/last/:userId", donationController.getLastDonationByUser)

router.delete("/deletedonation/:id", authController.restrict('Admin') ,donationController.deleteDonation)

module.exports = router;
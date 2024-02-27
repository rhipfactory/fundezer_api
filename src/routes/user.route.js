const express = require('express');
const userController = require("../controllers/user.controller")
const authController = require('./../controllers/auth.controller');

const router = express()

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/", userController.ping)

router.get("/getusers",userController.getAll)

router.get("/getprofile/:id", userController.getProfile)

router.get("/campaigns", userController.getCampaignsByStatus)

router.put("/admin/approve/:campaignId", authController.restrict('Admin'), userController.approveCampaign)

router.get("/admin/users", authController.restrict('Admin'), userController.getUsers)

router.put('/editprofile/:id', userController.editProfile);

router.get("/activities", userController.getActivities)

router.delete("/deleteprofile/:id", authController.restrict('Admin') ,userController.deleteUser)

module.exports = router;
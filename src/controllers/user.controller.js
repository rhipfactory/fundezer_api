const User = require("../models/user.model");
const Case = require('../models/cases.model')
const Donation = require("../models/donation.model")
const Comment = require('../models/comment.model')
const Campaign = require('../models/campaign.model');
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Ping the Route `test`
 * @route `@any`
 * @access Public
 * @type POST
 */
exports.ping = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Hello from User',
    data: req.body || {}
  });
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all Users Controller
 * @route `/api/user/getusers`
 * @access Private
 * @type GET
 */
exports.getAll = catchAsync(async(req, res, next)=>{
  try {
    const data = await User.find().populate(["_campaign", "_donation"])

    // Check if the users exists
    if(!data){
      return next(new AppError("Users not found", 404));
    }

    // Return data of list of all users
    res.status(200).json({
        success: true,
        len: data.length,
        data
    })
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
})

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get users profile Controller
 * @route `/api/user/getprofile/:id`
 * @access Private
 * @type GET
 */
exports.getProfile = catchAsync(async (req, res, next) => {
  try {
        // Get the user by id
    const data = await User.findById(req.params.id).populate(["_campaign", "_donation"])

    // Check if the user exists
    if (!data) {
      return next(new AppError('Profile not found', 404));
    }

    // Return data after the user has gotten the profile
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description G// Get all pending campaigns (Admin) Controller
 * @route `/api/user/campaigns`
 * @access Private
 * @type GET
 */
exports.getCampaignsByStatus = catchAsync(async (req, res, next) => {
  try {
    const { status } = req.query;

    // Define the allowed status values
    const allowedStatusValues = ["Pending", "Completed", "Declined", "Closed", "Approved"];
  
    // Check if the provided status is valid
    if (status && !allowedStatusValues.includes(status)) {
      return next(new AppError('Invalid status value' , 400));
    }
  
    // Create the query object based on the provided status
    const query = status ? { status } : {};
  
    // Find campaigns based on the query
    const campaigns = await Campaign.find(query);
  
    res.status(200).json({
      success: true,
      len: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Approve campaign Controller
 * @route `/api/user/admin/approve/:campaignId`
 * @access Private
 * @type PUT
 */
exports.approveCampaign = catchAsync(async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.body;
  
    // Find the campaign by ID
    const campaign = await Campaign.findById(campaignId);
  
    // Check if the campaign exists
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
  
    // Check if the campaign is already approved or declined
    if (campaign.status === 'Approved' || campaign.status === 'Declined') {
      return res.status(400).json({ error: 'Campaign status cannot be updated' });
    }
  
    // Update the campaign status based on the provided action
    if (status === 'approve') {
      campaign.status = 'Approved';
    } else if (status === 'decline') {
      campaign.status = 'Declined';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  
    // Save the updated campaign
    await campaign.save();
  
    // Save the updated campaign
    await campaign.save();
  
    res.status(200).json({
      success: true,
      message: `Campaign ${status === 'approve' ? 'approved' : 'declined'} successfully`,
      data: campaign,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get users by type Controller
 * @route `/api/user/admin/users`
 * @access Private
 * @type GET
 */
exports.getUsers = catchAsync(async (req, res, next) => {
  try {
    const { userType } = req.query;

    let query = {};
  
    // Check if userType is provided in the query
    if (userType) {
      query.userType = userType;
    }
  
    const users = await User.find(query);
  
    // Check if any users are found
    if (users.length === 0) {
      return next(new AppError('Users not found', 404));
    }
  
    res.status(200).json({
      success: true,
      len: users.length,
      data: users,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Edit user profile Controller
 * @route `/api/user/editprofile/:id`
 * @access Private
 * @type PUT
 */
exports.editProfile = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
  
    // Find the user by ID
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
  
    // Check if the user exists
    if (!user) {
      return next(new AppError('User not found', 404));
    }
  
    await user.save();
  
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});
/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all activities Controller
 * @route `/api/user/activities`
 * @access Private
 * @type GET
 */
exports.getActivities = catchAsync(async (req, res, next) => {
  try {
    const activities = [];

    // Retrieve activities for Case
    const caseActivities = await Case.find().sort({ createdAt: -1 });
    activities.push(...caseActivities);

    // Retrieve activities for Campaign
    const campaignActivities = await Campaign.find().sort({ createdAt: -1 });
    activities.push(...campaignActivities);

    // Retrieve activities for Donation
    const donationActivities = await Donation.find().sort({ createdAt: -1 });
    activities.push(...donationActivities);

    // Retrieve activities for User
    const userActivities = await User.find().sort({ createdAt: -1 });
    activities.push(...userActivities);

    // Retrieve activities for Comment
    const commentActivities = await Comment.find().sort({ createdAt: -1 });
    activities.push(...commentActivities);

    // Shuffle the activities based on the newest sort order
    activities.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      len: activities.length,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred, please try again.",
    });
  }
});



/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete a user Controller
 * @route `/api/user/deleteprofile/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteUser =  catchAsync(async (req, res, next) =>{
  try {
      //Get the user id
  const user = await User.findByIdAndDelete(req.params.id)

  // Check if the user exists
  if (!user) {
      return next(new AppError('No user found with that Id', 404));
    }

  // Return data after the user has been deleted
  res.status(200).json({
      success: true,
      data : {
          user: null
      }
  })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred, please try again.",
    });
  }
})

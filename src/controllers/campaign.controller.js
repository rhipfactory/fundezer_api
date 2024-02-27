const Campaign = require('../models/campaign.model');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Comment = require("../models/comment.model");
const Request = require('../models/request.model')
const sendEmail = require('../utils/sendEmail');


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
      message: 'Hello from Campaign',
      data: req.body || {}
    });
  });

  /**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all request
 * @route `/api/campaign/allrequest`
 * @access Private
 * @type GET
 */
exports.getAllReuqest = catchAsync(async (req, res, next) => {
    try {
      // Find all request records
      const request = await Request.find()
  
      res.status(200).json({
        success: true,
        length: request.length,
        data: request,
      });
    } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
    }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description update withdrawal request
 * @route `/api/campaign/approve/:requestId`
 * @access Private
 * @type PATCH
 */
exports.updateWithdrawalRequestStatus = catchAsync(async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const { status } = req.body;

    // Find the request by its ID
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // Update the request status based on the provided status
    if (status === 'approved' || status === 'rejected') {
      request.status = status;
      await request.save();

      res.status(200).json({
        success: true,
        message: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        data: request,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }
  } catch (error) {
    console.error('Error in updateWithdrawalRequestStatus:', error);
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description make a request for withdrawal
 * @route `/api/campaign/request`
 * @access Public
 * @type GET
 */
exports.createWithdrawalRequest = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const campaignId = req.params.campaignId; 
    const { amount, bankName, accountName, accountNumber} = req.body;

    // Check if the campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return next(new AppError('Campaign not found.', 404));
    }

    // Create a new withdrawal request with default status "pending" and associated campaign
    const request = await Request.create({
      _user: userId,
      _campaign: campaignId,
      amount,
      bankName,
      accountName,
      accountNumber,
    });

    const message = `
      Hi ${req.user.name}, 
      
      Your withdrawal request for campaign "${campaign.title}" has been received and is pending approval.
      
      Amount: ${amount}
      Bank Name: ${bankName}
      Account Name: ${accountName}
      Account Number: ${accountNumber}
      
      Thank you for using 'Fundezer' 🚀`;

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Request for withdrawal 🚀',
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: request,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all Campaign Controller
 * @route `/api/campaign/getcampaigns`
 * @access Private
 * @type GET
 */
exports.getAll = catchAsync(async(req, res, next)=>{
  try {
    const data = await Campaign.find().populate('_user')
  
    // Check if the Campaign exists
      if(!data){
          return next(new AppError("Campaign not found", 404));
      }
  
      // Return data of list of all Campaign
      res.status(200).json({
          success: true,
          len: data.length,
          data
      })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while Getting comments',
    });
  }
  })

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get a campaign Controller
 * @route `/api/campaign/getcampaign/:id`
 * @access Private
 * @type GET
 */
exports.getCampaign = catchAsync(async (req, res, next) => {
  try {
      // Get the campaign by id
      const data = await Campaign.findById(req.params.id).populate("_user")

      // Check if the campaign exists
      if (!data) {
        return next(new AppError('campaign not found', 404));
      }

      // Return data after the campaign
      res.status(200).json({
        success: true,
        data,
      });
  } catch (error) {
   next(new AppError("An error occurred. Please try again")) 
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Post a Get all comments Controller
 * @route `/api/campaign/getallcomments`
 * @access Private
 * @type POST
 */
exports.GetComments = catchAsync(async (req, res, next) => {
  try {
    const data = await Comment.find().populate('user')
  
    // Check if the Campaign exists
      if(!data){
          return next(new AppError("Comment not found", 404));
      }
  
      // Return data of list of all Campaign
      res.status(200).json({
          success: true,
          len: data.length,
          data
      })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while Getting comments',
    });
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Post a Campaign Controller
 * @route `/api/campaign/postcampaign`
 * @access Private
 * @type POST
 */
exports.postCampaign = catchAsync(async (req, res, next) => {
  const {
    state,
    typeOfFundraising,
    title,
    description,
    startDate,
    endDate,
    raise,
    MedicalReport,
    imageOrVideo,
    sponsor,
    saveAsDraft, // New field to determine if the campaign should be saved as a draft
  } = req.body;

  const user = await User.findById(req.user.id); // Retrieve user ID from req.user

  // Create a new campaign Object
  const campaign = new Campaign({
    state,
    typeOfFundraising,
    title,
    startDate,
    _user: user._id, // Assign user ID to _user
    description,
    MedicalReport,
    raise,
    endDate,
    imageOrVideo,
    sponsor,
    status: user.userType === 'Individual' || user.userType === 'Sponsor' ? 'Pending' : 'Approved',
  });

  if (!campaign) {
    return next(new AppError('Please provide the required fields', 401));
  }

  // Save the campaign object to the database
  await campaign.save();

  user._campaign.push(campaign._id);
  await user.save();

  res.status(200).json({
    success: true,
    message: saveAsDraft ? 'Campaign saved as draft' : 'Campaign created successfully',
    data: campaign,
  });
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Post a Comment Controller
 * @route `/api/campaign/postcomment`
 * @access Private
 * @type POST
 */
exports.createComment = catchAsync(async (req, res, next) => {
  const { campaignId, userId, content } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    const comment = new Comment({
      campaign: campaignId,
      user: userId,
      content,
    });

    await comment.save();

    campaign.comments.push(comment._id);
    
    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Post a draft Controller
 * @route `/api/campaign/postdraft/:id`
 * @access Private
 * @type GET
 */
exports.postSavedDraftCampaign = catchAsync(async (req, res, next) => {
  const { campaignId } = req.params;

  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  if (campaign.status !== 'Draft') {
    return next(new AppError('Campaign is not a draft', 400));
  }

  campaign.status = 'Pending';
  await campaign.save();

  res.status(200).json({
    success: true,
    message: 'Campaign posted successfully',
    data: campaign,
  });
});



/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description  Query Campaign based on time controller
 * @route `/api/campaign/campaigns`
 * @access Private
 * @type GET
 */
exports.getBasedOnTime = catchAsync(async (req, res, next) => {
  const { interval } = req.query;

  let startDate, endDate;

  // Calculate the start and end dates based on the interval
  if (interval === 'weekly') {
    startDate = startOfWeek(new Date());
    endDate = endOfWeek(new Date());
  } else if (interval === 'monthly') {
    startDate = startOfMonth(new Date());
    endDate = endOfMonth(new Date());
  }

  // Create the query object with the date range
  const query = startDate && endDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};

  // Get the Campaign that match the query
  const campaign = await Campaign.find(query).populate('user');
  
  // Check if any Campaign match the query
  if (!campaign || campaign.length === 0) {
    const errorMessage = startDate && endDate
      ? `No Campaigns found within the ${interval} interval`
      : 'Campaigns not found';
    return next(new AppError(errorMessage, 404));
  }
  
  // Return the list of Campaign
  res.status(200).json({
    success: true,
    len: campaign.length,
    campaign,
  });
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Close a campaign controller
 * @route `/api/campaign/campaign'`
 * @access Private
 * @type GET
 */
exports.getCampaignByStatus = catchAsync(async (req, res, next) => {
  const typeOfFundraising = req.query.typeOfFundraising;

  // Create the query object
  const query = typeOfFundraising ? { typeOfFundraising } : {};

  // Get the campaigns that match the query
  const data = await Campaign.find(query).populate('_user');

  // Check if any campaigns match the query
  if (data.length === 0) {
    const queryMessage = typeOfFundraising
      ? `No campaigns found for the type of fundraising: ${typeOfFundraising}`
      : 'No campaigns found';
    return next(new AppError(queryMessage, 404));
  }

  // Return the campaigns that match the query
  res.status(200).json({
    success: true,
    data,
  });
});
  
/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Close a campaign controller
 * @route '/api/campaign/close/:id'
 * @access Private
 * @type PATCH
 */
exports.closeCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { status: 'Closed' },
    { new: true }
  );
  
  if (!campaign) {
    return next(new AppError('No Campaign found with that Id', 404));
  }
  
  res.status(200).json({
  success: true,
  message: 'Campaign closed successfully',
  data: campaign
  });
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete a campaign Controller
 * @route `/api/campaign/deletecampaign/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteCampaign =  catchAsync(async (req, res, next) =>{
    //Get the user id
    const campaign = await Campaign.findByIdAndDelete(req.params.id)
  
    // Check if the Campaign exists
    if (!campaign) {
        return next(new AppError('No Campaign found with that Id', 404));
      }
  
    // Return data after the campaign has been deleted
    res.status(200).json({
        success: true,
        message: "Campaign deleted successfully",
        data : {
            campaign: null
        }
    })
  })
  
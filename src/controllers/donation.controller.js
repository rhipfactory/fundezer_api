const Donation = require('../models/donation.model');
const Campaign = require('../models/campaign.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { initializePayment, verifyPayment, createSubscription } = require('./paystack.controller');
const Case = require('../models/cases.model')
const mongoose = require('mongoose');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

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
      message: 'Hello from donation',
      data: req.body || {}
    });
  });
  

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all donation Controller
 * @route `/api/donation/getdonations`
 * @access Private
 * @type GET
 */
exports.getAll = catchAsync(async(req, res, next)=>{
  try {
        // Get all donations
        const donations = await Donation.find().populate('user')

        // Check if the users exists
      if(!donations){
          return next(new AppError("donations not found", 404));
      }
  
      // Return donations of list of all donations
      res.status(200).json({
          success: true,
          len: donations.length,
          donations
      })
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
})


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Query donation based on time controller
 * @route `/api/donation/postdonation/donations`
 * @access Private
 * @type GET
 */
exports.getBasedOnTime = catchAsync(async (req, res, next) => {
  try {
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
  
    // Get the donations that match the query
    const donations = await Donation.find(query).populate('user');
  
    // Check if any donations match the query
    if (!donations || donations.length === 0) {
      const errorMessage = startDate && endDate
        ? `No donations found within the ${interval} interval`
        : 'Donations not found';
      return next(new AppError(errorMessage, 404));
    }
  
    // Return the list of donations
    res.status(200).json({
      success: true,
      len: donations.length,
      donations,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Make a donation Controller
 * @route `/api/donation/postdonation/:campaignId`
 * @access Private
 * @type POST
 */
exports.visitorDonation = catchAsync(async (req, res, next) => {
  const { campaignId } = req.params;
  const { amount, email } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'Closed') {
      return res.status(404).json({
        status: false,
        message: 'Cannot make a donation to a closed campaign',
      });
    }

    const donation = new Donation({  campaign: campaignId, amount });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    await donation.save();

    const reference = donation._id;
    const authorizationUrl = await initializePayment(amount, email, reference);

    const responseData = {
      donation,
      authorizationUrl,
      amountRaised: campaign.amountGotten,
      amountRemaining: campaign.raise - campaign.amountGotten,
      reference: reference, // Include the reference in the response
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while making the donation',
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Veirfy donation to a campaign Controller
 * @route `/api/donation/verify`
 * @access Private
 * @type POST
 */
exports.verifyVis = catchAsync(async (req, res, next) => {
  const { reference } = req.body;

  try {
    const paymentData = await verifyPayment(reference);

    // Check if the payment is successful
    if (paymentData.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Update campaign amountGotten
    // Update the isVerified field of the donation to true
    const donation = await Donation.findByIdAndUpdate(reference, { isVerified: true });

    if (!donation) {
      console.log('Donation not found with reference:', reference);
      return res.status(404).json({ error: 'Donation not found' });
    }

    const amount = donation.amount;
    const campaignId = donation.campaign;
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { amountGotten: amount } },
      { new: true }
    );

    if (!campaign) {
      console.log('Campaign not found with ID:', campaignId);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    console.log('Updated campaign:', campaign);

    // Return a success response if everything is completed
    return res.status(200).json({
      success: true,
      message: 'Payment verification successful',
      paymentData,
    });
  } catch (error) {
    console.error('Error during payment verification:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment',
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Make a donation Controller
 * @route `/api/donation/postdonation/:campaignId`
 * @access Private
 * @type POST
 */
exports.makeDonation = catchAsync(async (req, res, next) => {
    const { campaignId } = req.params;
    const { userId, amount, email } = req.body;
  
    try {
      const campaign = await Campaign.findById(campaignId);
  
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
  
      if (campaign.status === 'Closed') {
        return res.status(404).json({
          status: false,
          message: 'Cannot make a donation to a closed campaign',
        });
      }
  
      const donation = new Donation({ user: userId, campaign: campaignId, amount });
  
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
  
      await donation.save();
  
      const reference = donation._id;
      const authorizationUrl = await initializePayment(amount, email, reference);
  
      const responseData = {
        donation,
        authorizationUrl,
        amountRaised: campaign.amountGotten,
        amountRemaining: campaign.raise - campaign.amountGotten,
        reference: reference, // Include the reference in the response
      };
  
      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while making the donation',
      });
    }
});
  
/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Veirfy donation to a campaign Controller
 * @route `/api/donation/verify`
 * @access Private
 * @type POST
 */
exports.verify = catchAsync(async (req, res, next) => {
  const { reference } = req.body;

  try {
    const paymentData = await verifyPayment(reference);

    // Check if the payment is successful
    if (paymentData.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Update campaign amountGotten
    // Update the isVerified field of the donation to true
    const donation = await Donation.findByIdAndUpdate(reference, { isVerified: true });

    if (!donation) {
      console.log('Donation not found with reference:', reference);
      return res.status(404).json({ error: 'Donation not found' });
    }

    const amount = donation.amount;
    const campaignId = donation.campaign;
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { amountGotten: amount } },
      { new: true }
    );

    if (!campaign) {
      console.log('Campaign not found with ID:', campaignId);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    console.log('Updated campaign:', campaign);

    // Return a success response if everything is completed
    return res.status(200).json({
      success: true,
      message: 'Payment verification successful',
      paymentData,
    });
  } catch (error) {
    console.error('Error during payment verification:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment',
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Make a donation for a Case Controller
 * @route `/api/donation/postdonationcase/:caseId`
 * @access Private
 * @type POST
 */
exports.makeDonationCase = catchAsync(async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { userId, amount, email } = req.body;
  
    try {
      const cas = await Case.findById(caseId);
  
      if (!cas) {
        return res.status(404).json({ error: 'Case not found' });
      }
  
      const donation = new Donation({ user: userId, case: caseId, amount });
  
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
      
      await donation.save();
  
      const reference = donation._id;
      const authorizationUrl = await initializePayment(amount, email, reference);
  
  
      res.status(200).json({
        success: true,
        data: {
          donation,
          authorizationUrl,
          amountDonated: cas.amountDonated,
          reference: reference,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while making the donation',
      });
    }
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});




exports.verifyCase = catchAsync(async (req, res, next) => {
  const { reference } = req.body;

  try {
    const paymentData = await verifyPayment(reference);

    // Check if the payment is successful
    if (paymentData.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Update campaign amountGotten or case amountDonated based on donation type
    const donation = await Donation.findByIdAndUpdate(reference, { isVerified: true });
    if (!donation) {
      console.log('Donation not found with reference:', reference);
      return res.status(404).json({ error: 'Donation not found' });
    }

    const amount = donation.amount;
    const caseId = donation.case;
    const cas = await Case.findByIdAndUpdate(
      caseId,
      { $inc: { amountDonated: amount } },
      { new: true }
    );

    if (!cas) {
      console.log('Case not found with ID:', caseId);
      return res.status(404).json({ error: 'Case not found' });
    }

    console.log('Updated case:', cas);

    // Return a success response if everything is completed
    return res.status(200).json({
      success: true,
      message: 'Payment verification successful',
      paymentData,
    });
  } catch (error) {
    console.error('Error during payment verification:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment',
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Make a recurring Controller
 * @route `/api/donation/postdonation`
 * @access Private
 * @type POST
 */
exports.makeRecurringDonation = catchAsync(async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { userId, amount, email, subscriptionPlan } = req.body;
  
    try {
      const campaign = await Campaign.findById(campaignId);
  
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
  
      campaign.amountDonated += amount;
      campaign.amountGotten = campaign.amountDonated; // Update the amountGotten to match the amountDonated
      await campaign.save();
  
      const donation = new Donation({ user: userId, campaign: campaignId, amount, subscriptionPlan });
  
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
  
      await donation.save();
  
      const reference = donation._id;
      const authorizationUrl = await initializePayment(amount, email, reference);
  
      // Create recurring payment subscription
      const subscription = await createSubscription(amount, email, reference, subscriptionPlan);
  
      // Save the subscription details to the donation or user
      donation.subscriptionId = subscription.id;
      await donation.save();
  
      res.status(200).json({
        success: true,
        data: {
          donation,
          authorizationUrl,
          amountRaised: campaign.amountGotten,
          amountRemaining: campaign.raise - campaign.amountGotten,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while making the donation',
        error: error.message, // Add this line to include the error message in the response
      })
    }
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});
    
    
  
/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get Donation Controller
 * @route `/api/donation/getdonation/:id`
 * @access Private
 * @type GET
 */
exports.getDonation = catchAsync(async (req, res, next) => {
  try {
    // Get the donation by id
    const data = await Donation.findById(req.params.id).populate("user")

      // Check if the donation exists
      if (!data) {
        return next(new AppError('Donation not found', 404));
      }
  
      // Return data after the Donation
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
 * @description Get the total amount donated by a particular user
 * @route `/api/donation/total/:userId`
 * @access Private
 * @type GET
 */
exports.getTotalDonationsByUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return next(new AppError('User not found', 404));
    }

    // Calculate the total amount of verified donations made by the user
    const totalAmountDonated = await Donation.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId), isVerified: true } // Add the isVerified: true condition
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
    ]);

    const totalDonations = totalAmountDonated.length > 0 ? totalAmountDonated[0].totalAmount : 0;

    res.status(200).json({
      success: true,
      totalDonations,
    });
  } catch (error) {
    console.error('Error occurred:', error);
    return next(new AppError('An error occurred, please try again', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get the total amount donated by a particular user to a case
 * @route `/api/users/:userId/cases/:caseId/donations/total`
 * @access Private
 * @type GET
 */
exports.getTotalDonationsByUserAndCase = catchAsync(async (req, res, next) => {
  try {
    const { userId, caseId } = req.params;

    if (!userId || !caseId) {
      return next(new AppError('User or Case not found', 404));
    }
  
    // Calculate the total amount donated by the user to the case
    const totalAmountDonated = await Donation.aggregate([
      { $match: {
        user: new mongoose.Types.ObjectId(userId),
        case: new mongoose.Types.ObjectId(caseId)
      } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);
  
    const totalDonations = totalAmountDonated.length > 0 ? totalAmountDonated[0].totalAmount : 0;
  
    res.status(200).json({
      success: true,
      totalDonations
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description // Get total donations by a user for a campagin
 * @route `/api/users/:userId/campaign/:campaignId/donations/total
 * @access Private
 * @type GET
 */
exports.getTotalDonationsByUserAndCampagin = catchAsync(async (req, res, next) => {
  try {
    const { userId, campaignId } = req.params;

    if (!userId || !campaignId) {
      return next(new AppError('User or Case not found', 404));
    }
  
    // Calculate the total amount donated by the user to the case
    const totalAmountDonated = await Donation.aggregate([
      { $match: {
        user: new mongoose.Types.ObjectId(userId),
        campaign: new mongoose.Types.ObjectId(campaignId)
      } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);
  
    const totalDonations = totalAmountDonated.length > 0 ? totalAmountDonated[0].totalAmount : 0;
  
    res.status(200).json({
      success: true,
      totalDonations
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description // Get the last donation and its amount by a particular donor
 * @route `/api/donation/last/:userId`
 * @access Private
 * @type GET
 */
exports.getLastDonationByUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return next(new AppError('User not found', 404));
    }
  
  
    // Get the last donation by the user
    const lastDonation = await Donation.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .select('amount');
  
      if (!lastDonation) {
        return res.status(200).json({
          success: true,
          message: 'No donations found for the user',
        });
      }
      
      res.status(200).json({
        success: true,
        lastDonation,
      });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete a Donation Controller
 * @route `/api/donation/deletedonation/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteDonation =  catchAsync(async (req, res, next) =>{
  try {
    //Get the user id
    const donation = await Donation.findByIdAndDelete(req.params.id)

    // Check if the user exists
    if (!donation) {
        return next(new AppError('No Donation found with that Id', 404));
      }
  
    // Return data after the donation has been deleted
    res.status(200).json({
        success: true,
        message: "Donation deleted successfully",
        data : {
            donation: null
        }
    })
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
})
  
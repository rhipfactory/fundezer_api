const Case = require('../models/cases.model')
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
      message: 'Hello from Cases',
      data: req.body || {}
    });
  });

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all Cases Controller
 * @route `/api/case/getcases`
 * @access Private
 * @type GET
 */
exports.getAll = catchAsync(async(req, res, next)=>{
  try {
    const data = await Case.find().populate('_user')
  
    // Check if the case exists
      if(!data){
        return next(new AppError("Case not found", 404));
      }
  
      // Return data of list of all cases
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
 * @description Get a Case Controller
 * @route `/api/case/getcase/:id`
 * @access Private
 * @type GET
 */
exports.getCase = catchAsync(async (req, res, next) => {
  try {
    // Get the Case by id
    const data = await Case.findById(req.params.id).populate("_user")

    // Check if the Case exists
      if (!data) {
        return next(new AppError('Case not found', 404));
      }

      // Return data after the Case
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
 * @description Post a case Controller
 * @route `/api/case/postcase`
 * @access Private
 * @type POST
 */
exports.postCase = catchAsync(async(req, res, next)=>{
  try {
    const {Name, Description, _user} = req.body;

    const user = await User.findById(_user);

     // Create a new case Object
    const cause = new Case({
        Name, 
        Description, 
        _user, 
      
    })

    if (!cause) {
        return next(new AppError('Please provide the required fields', 401));
    }

    // Save the case object to the database
    await cause.save()

    user._case.push(cause._id)

    await user.save()

    // const causeLink = `http://localhost:30000/cause/${cause._id}`;

    res.status(200).json({
        success: true,
        message: 'Case created successfully',
        data: cause
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500));
  }
})

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Edit case Controller
 * @route `/api/case/editcase/:id`
 * @access Private
 * @type PUT
 */
exports.editCase = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
  
    // Find the user by ID
    const cause = await Case.findByIdAndUpdate(id, updates, { new: true });
  
    // Check if the cause exists
    if (!cause) {
      return next(new AppError('Case not found', 404));
    }
  
    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      data: cause,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete a Case Controller
 * @route `/api/case/deletecase/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteCase =  catchAsync(async (req, res, next) =>{
  try {
    //Get the case id
    const cause = await Case.findByIdAndDelete(req.params.id)

    // Check if the case exists
    if (!cause) {
        return next(new AppError('No case found with that Id', 404));
      }
  
    // Return data after the case has been deleted
    res.status(200).json({
        success: true,
        message: "Case deleted successfully",
        data : {
          cause: null
        }
    })
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500));
  }
})
  
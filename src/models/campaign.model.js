const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    _user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    state: {
      type: String,
    },
    typeOfFundraising: {
      type: String,
      enum: ["Cancer", "Diabetes", "Surgery", "Organ transplant", "Others", "Injury",],
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    raise: {
      type: Number,
    },
    amountDonated: {
      type: Number,
      default: 0,
    },
    amountGotten: {
      type: Number,
      default: 0,
    },
    imageOrVideo: [],
    MedicalReport: {
      type: String,
    },
    sponsor: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Declined", "Approved", "Closed", "Draft"],
      default: "Pending",
    },
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    }],
    draft: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to calculate the amount raised
campaignSchema.virtual('amountRaised').get(function () {
  return this.amountDonated || 0;
});

// Virtual property to populate the comments
campaignSchema.virtual('populatedComments', {
  ref: 'Comment',
  localField: 'comments',
  foreignField: '_id',
});

// Virtual property to calculate the amount remaining
campaignSchema.virtual('amountRemaining').get(function () {
  const raise = parseInt(this.raise) || 0;
  const amountRaised = parseInt(this.amountDonated) || 0;
  return raise - amountRaised;
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;

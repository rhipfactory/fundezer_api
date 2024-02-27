const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  user: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  campaign: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',

  }],
  case: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',

  }],
  amount: {
    type: Number,
    required: true,
  },
  subscriptionPlan: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
  },
  isVerified: {
    type: Boolean,
    default: false, // Set to false by default for new donations
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;

const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    _user: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    Name: {
      type: String,
    },
    Description: {
      type: String,
    },
    amountDonated: {
      type: Number,
      default: 0,
    },

  },
);

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;

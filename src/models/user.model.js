const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image : [

    ],
    email: {
      type: String,
      trim: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid Email address',
      ],
      required: true,
    },
    Gender: {
      type: String,
      enum: ['male', 'female'],
    },
    userType: {
      type: String,
      enum: ["Individual", "Sponsor", "Admin"]
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
    },
    passwordConfirm: {
      type: String,
    },
    profileSet: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    _case: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case'
      }
    ],
    _campaign:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
      }
    ],
    _donation: [
      {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    }
  ],
    otp: {
      type: Number,
    }
  },
);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

//Compare users password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
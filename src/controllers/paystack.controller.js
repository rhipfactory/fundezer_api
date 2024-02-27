const axios = require('axios');

const initializePayment = async (amount, email, reference) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: amount * 100, // Paystack expects amount in kobo (minimum unit)
        email,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.authorization_url;
  } catch (error) {
    
    const errorMessage = error.response.data.message || 'Failed to initialize payment with Paystack';
    return res.status(500).send({
      success: false,
      message: errorMessage,
    });
  }
};

const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to verify payment with Paystack";
    throw new Error(errorMessage);
  }
};

const createSubscription = async (amount, email, reference, plan) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/subscription',
      {
        amount: amount * 100, // Paystack expects amount in kobo (minimum unit)
        email,
        reference,
        plan,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to create subscription with Paystack';
    return res.status(500).send({
      success: false,
      message: errorMessage,
    });
  }
};


module.exports = {
  initializePayment,
  verifyPayment,
  createSubscription
};

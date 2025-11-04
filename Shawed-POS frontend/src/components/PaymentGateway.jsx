import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Banknote, AlertCircle, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

/**
 * Advanced PaymentGateway component supports multiple payment methods
 * including Stripe, M-Pesa, Mobile Money, and traditional cash payments
 */
export default function PaymentGateway({ 
  amount, 
  customerInfo, 
  onPaymentSuccess, 
  onPaymentError, 
  isDarkMode = false,
  isVisible = false,
  onClose 
}) {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  const [paymentDetails, setPaymentDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [processingFee, setProcessingFee] = useState(0);

  const paymentMethods = [
    {
      id: 'Merchent',
      name: 'Merchent',
      icon: Banknote,
      description: 'Pay with Merchent',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900',
      fee: 5%,
      available: true
    },
    {
      id: 'Evc-Plus',
      name: 'Evc-Plus',
      icon: Smartphone,
      description: 'Pay with Evc-Plus',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900',
      fee: 0, // 2% fee
      available: true
    },
    {
      id: 'E-Dahab',
      name: 'E-Dahab',
      icon: CreditCard,
      description: 'Pay with E-Dahab',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900',
      fee: 0, // 2.9% fee
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Banknote,
      description: 'Direct bank transfer',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900',
      fee: 0, // 1.5% fee
      available: true
    }
  ];

  useEffect(() => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (method) {
      const totalFee = amount * method.fee;
      setProcessingFee(totalFee);
    }
  }, [selectedMethod, amount]);

  const handlePayment = async () => {
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      let result;
      
      switch (selectedMethod) {
        case 'cash':
          result = await processCashPayment();
          break;
        case 'mpesa':
          result = await processMpesaPayment();
          break;
        case 'stripe':
          result = await processStripePayment();
          break;
        case 'bank_transfer':
          result = await processBankTransfer();
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (result.success) {
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess(result);
          onClose();
        }, 2000);
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Payment processing failed');
    }
  };

  const processCashPayment = async () => {
    // Simulate cash payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      transactionId: `CASH_${Date.now()}`,
      method: 'payment-cash',
      amount,
      fee: 0,
      timestamp: new Date().toISOString()
    };
  };

  const processMpesaPayment = async () => {
    // Simulate M-Pesa STK Push
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // In real implementation, integrate with M-Pesa API
    const mockMpesaResponse = {
      success: true,
      transactionId: `MPESA_${Date.now()}`,
      method: 'payment-mpesa',
      amount,
      fee: processingFee,
      timestamp: new Date().toISOString(),
      phoneNumber: customerInfo?.phone || '+254700000000'
    };
    
    return mockMpesaResponse;
  };

  const processStripePayment = async () => {
    try {
      // Initialize Stripe (replace with your publishable key)
      const stripe = await loadStripe('pk_test_your_stripe_key');
      
      if (!stripe) {
        throw new Error('Stripe not properly configured');
      }

      // Create payment intent (simulated)
      const response = await axios.post('/api/create-payment-intent', {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerInfo?.id
      });

      if (response.data.success) {
        return {
          success: true,
          transactionId: `STRIPE_${response.data.paymentIntent.id}`,
          method: 'payment-stripe',
          amount,
          fee: processingFee,
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error(response.data.error || 'Stripe payment failed');
    } catch (error) {
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  };

  const processBankTransfer = async () => {
    // Simulate bank transfer processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      transactionId: `BANK_${Date.now()}`,
      method: 'payment-bank',
      amount,
      fee: processingFee,
      timestamp: new Date().toISOString()
    };
  };

  const totalAmount = amount + processingFee;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <Lock className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Secure Payment
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose your payment method
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
          >
            ✕
          </button>
        </div>

        {/* Payment Summary */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <div className="space-y-2">
            <div className="flex justify-between">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Amount:</span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>${amount.toFixed(2)}</span>
            </div>
            {processingFee > 0 && (
              <div className="flex justify-between">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Processing Fee:</span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>${processingFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total:</span>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Payment Methods
          </h4>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              const feeText = method.fee > 0 ? `(+${(method.fee * 100).toFixed(1)}% fee)` : '(No fee)';

              return (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={!method.available || paymentStatus === 'processing'}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? `${isDarkMode ? 'border-blue-500 bg-blue-900' : 'border-blue-500 bg-blue-50'} ring-2 ring-blue-200` 
                      : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'}`
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg mr-4 ${method.bgColor}`}>
                        <Icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <div className="text-left">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {method.name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {method.description} {feeText}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg"
            >
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                <span className="text-blue-800 dark:text-blue-200">Processing payment...</span>
              </div>
            </motion.div>
          )}

          {paymentStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 dark:text-green-200">Payment successful!</span>
              </div>
            </motion.div>
          )}

          {paymentStatus === 'error' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
              </div>
            </motion.div>
          )}

          {/* Payment Button */}
          <motion.button
            whileHover={{ scale: paymentStatus !== 'processing' ? 1.02 : 1 }}
            whileTap={{ scale: paymentStatus !== 'processing' ? 0.98 : 1 }}
            onClick={handlePayment}
            disabled={paymentStatus === 'processing'}
            className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
              paymentStatus === 'processing' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
            } shadow-lg`}
          >
            {paymentStatus === 'processing' ? (
              <>
                <RefreshCw className="h-5 w-5 inline mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 inline mr-2" />
                Pay ${totalAmount.toFixed(2)}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

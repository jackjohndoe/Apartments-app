import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { initializePayment, verifyPayment, verifyAndFundWallet } from '../services/flutterwaveService';
import { logger } from '../utils/logger';

export default function CardPaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { 
    amount, // Amount to fund wallet
    paymentProvider = 'flutterwave'
  } = route.params || {};
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);
  const [paymentInitData, setPaymentInitData] = useState(null);
  
  // Card details form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const formatPrice = (price) => {
    return `₦${price.toLocaleString()}`;
  };

  // Format card number with spaces
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Validate card details
  const validateCardDetails = () => {
    const errors = {};
    
    // Remove spaces for validation
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber || cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      errors.cardNumber = 'Please enter a valid card number';
    }
    
    if (!cardholderName || cardholderName.trim().length < 2) {
      errors.cardholderName = 'Please enter cardholder name';
    }
    
    const cleanedExpiry = expiryDate.replace(/\D/g, '');
    if (!cleanedExpiry || cleanedExpiry.length !== 4) {
      errors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const month = parseInt(cleanedExpiry.slice(0, 2));
      const year = parseInt('20' + cleanedExpiry.slice(2, 4));
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      if (month < 1 || month > 12) {
        errors.expiryDate = 'Please enter a valid month (01-12)';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }
    
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      errors.cvv = 'Please enter a valid CVV';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle card payment submission
  const handleCardPayment = async () => {
    if (!validateCardDetails()) {
      return;
    }

    if (!user || !user.email || !amount) {
      Alert.alert('Error', 'Missing required information. Please try again.');
      return;
    }

    try {
      setProcessing(true);
      
      // Initialize Flutterwave payment with card details for wallet funding
      try {
        const userName = user?.name || 'Guest';
        const userPhone = user?.phoneNumber || null;
        
        const paymentInit = await initializePayment(
          amount || 0,
          user.email,
          userName,
          userPhone,
          'card', // Payment method: card
          null, // Reference will be generated
          {
            cardNumber: cardNumber.replace(/\s/g, ''), // Send cleaned card number
            cardholderName,
            expiryDate,
            cvv,
          }
        );

        // Flutterwave returns transaction directly, not authorization_url
        if (paymentInit && paymentInit.status === 'success') {
          // Payment completed successfully
          await handlePaymentSuccess(paymentInit);
          return;
        } else if (paymentInit && paymentInit.status === 'pending') {
          // Payment is pending - show success modal
          setPaymentInitData(paymentInit);
          setPaymentReference(paymentInit.reference);
          Alert.alert(
            'Payment Pending',
            'Your payment is being processed. You will be notified once it is confirmed.',
            [{ text: 'OK' }]
          );
          return;
        } else {
          throw new Error('Payment was not completed');
        }
      } catch (paymentError) {
        logger.error('Error processing payment:', paymentError);
        // Show user-friendly error message
        const errorMsg = paymentError.message || 'Failed to process payment. Please check your card details and try again.';
        Alert.alert('Payment Error', errorMsg);
      }
    } catch (error) {
      logger.error('Error in payment flow:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (transaction) => {
    try {
      setProcessing(true);
      
      // Extract payment reference
      const paymentRef = transaction.reference || transaction.tx_ref || paymentReference;
      if (!paymentRef) {
        throw new Error('Payment reference not found');
      }

      logger.log('🔄 Processing successful wallet funding:', { paymentRef, amount });

      // CRITICAL: Verify payment and automatically fund wallet
      try {
        if (user && user.email && amount) {
          logger.log('💰 Verifying payment and funding wallet...');
          
          try {
            const walletFundingResult = await verifyAndFundWallet(
              paymentRef,
              user.email,
              amount,
              'card'
            );
            
            if (walletFundingResult.verified && walletFundingResult.funded) {
              logger.log('✅ Payment verified and wallet funded successfully!');
              logger.log('✅ Updated balance:', walletFundingResult.balance);
              
              // Wallet top-up email is already sent by verifyAndFundWallet
              Alert.alert(
                'Wallet Funded',
                `₦${amount.toLocaleString()} has been added to your wallet! A confirmation email has been sent.`,
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    setShowSuccessModal(true);
                    // Navigate back to wallet after a short delay
                    setTimeout(() => {
                      navigation.navigate('Wallet');
                    }, 1500);
                  }
                }]
              );
            } else if (walletFundingResult.verified && !walletFundingResult.funded) {
              console.warn('⚠️ Payment verified but wallet funding may have failed');
              Alert.alert(
                'Payment Verified',
                `Your payment has been verified. The wallet will be funded automatically within a few moments.`,
                [{ 
                  text: 'OK',
                  onPress: () => navigation.navigate('Wallet')
                }]
              );
            }
          } catch (verifyError) {
            console.error('❌ Error in verifyAndFundWallet:', verifyError);
            
            const isRetryable = verifyError.message && (
              verifyError.message.includes('pending') ||
              verifyError.message.includes('processing') ||
              verifyError.message.includes('still')
            );
            
            if (isRetryable) {
              console.log('⏳ Payment is pending, backend webhook will process funding');
              Alert.alert(
                'Payment Processing',
                `Your payment is being processed. Your wallet will be funded automatically once the payment is confirmed (usually within 1-2 minutes).`,
                [{ 
                  text: 'OK',
                  onPress: () => navigation.navigate('Wallet')
                }]
              );
            } else {
              try {
                await verifyPayment(paymentRef);
                console.log('✅ Fallback verification succeeded');
                Alert.alert(
                  'Payment Verified',
                  `Your payment has been verified. The wallet will be funded automatically.`,
                  [{ 
                    text: 'OK',
                    onPress: () => navigation.navigate('Wallet')
                  }]
                );
              } catch (fallbackError) {
                console.log('⚠️ Fallback verification also failed:', fallbackError);
                Alert.alert(
                  'Payment Received',
                  `Your payment has been received. The wallet will be funded automatically once processing is complete.`,
                  [{ 
                    text: 'OK',
                    onPress: () => navigation.navigate('Wallet')
                  }]
                );
              }
            }
          }
        } else {
          console.warn('⚠️ Cannot fund wallet: Missing user email or amount');
          Alert.alert('Error', 'Missing required information to fund wallet.');
        }
      } catch (error) {
        console.error('❌ Unexpected error in payment verification:', error);
        Alert.alert('Error', 'An error occurred while funding your wallet. Please contact support.');
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', error.message || 'Payment processing failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };


  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('Wallet');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet with Card</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Amount to Fund</Text>
          <Text style={styles.totalAmount}>{formatPrice(amount || 0)}</Text>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfoContainer}>
          <MaterialIcons name="lock" size={24} color="#FFD700" />
          <Text style={styles.paymentInfoText}>
            Secure payment powered by Flutterwave
          </Text>
        </View>

        {/* Card Details Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Card Details</Text>
          
          {/* Card Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={[styles.input, formErrors.cardNumber && styles.inputError]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#999"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
            />
            {formErrors.cardNumber && (
              <Text style={styles.errorText}>{formErrors.cardNumber}</Text>
            )}
          </View>

          {/* Cardholder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={[styles.input, formErrors.cardholderName && styles.inputError]}
              placeholder="John Doe"
              placeholderTextColor="#999"
              value={cardholderName}
              onChangeText={(text) => setCardholderName(text)}
              autoCapitalize="words"
            />
            {formErrors.cardholderName && (
              <Text style={styles.errorText}>{formErrors.cardholderName}</Text>
            )}
          </View>

          {/* Expiry Date and CVV */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={[styles.input, formErrors.expiryDate && styles.inputError]}
                placeholder="MM/YY"
                placeholderTextColor="#999"
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                keyboardType="numeric"
                maxLength={5}
              />
              {formErrors.expiryDate && (
                <Text style={styles.errorText}>{formErrors.expiryDate}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={[styles.input, formErrors.cvv && styles.inputError]}
                placeholder="123"
                placeholderTextColor="#999"
                value={cvv}
                onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              {formErrors.cvv && (
                <Text style={styles.errorText}>{formErrors.cvv}</Text>
              )}
            </View>
          </View>

          {/* Pay Now Button */}
          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handleCardPayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <Text style={styles.payButtonText}>Fund Wallet</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>


      {/* Loading Overlay */}
      {processing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <MaterialIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successMessage}>
              Your wallet has been funded successfully
            </Text>
            <Text style={styles.successDetails}>
              Amount: {formatPrice(amount || 0)}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  totalContainer: {
    padding: 20,
    backgroundColor: '#FFF9E6',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    padding: 20,
    paddingTop: 0,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  payButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDetails: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

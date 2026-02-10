import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../utils/userStorage';
import { createVirtualAccount, verifyAndFundWallet } from '../services/flutterwaveService';

export default function TransferPaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { 
    amount // Amount to fund wallet
  } = route.params || {};
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [virtualAccountError, setVirtualAccountError] = useState(null);
  const [txRef, setTxRef] = useState(null);

  // Debug: Log when virtualAccount state changes
  useEffect(() => {
    if (virtualAccount || loadingAccount || virtualAccountError) {
      console.log('🔍 Virtual Account State:', {
        status: loadingAccount ? 'loading' : virtualAccountError ? 'error' : virtualAccount ? 'ready' : 'idle',
        hasAccount: !!virtualAccount,
        accountNumber: virtualAccount?.accountNumber || 'N/A',
        bankName: virtualAccount?.bankName || 'N/A',
        accountName: virtualAccount?.accountName || 'N/A',
        txRef: txRef || 'N/A',
        error: virtualAccountError || null,
        timestamp: new Date().toISOString()
      });
    }
  }, [virtualAccount, loadingAccount, virtualAccountError, txRef]);

  const formatPrice = (price) => {
    return `₦${price.toLocaleString()}`;
  };

  // Generate unique transaction reference and fetch virtual account
  useEffect(() => {
    const fetchVirtualAccount = async () => {
      if (!user || !user.email || !amount) {
        setLoadingAccount(false);
        return;
      }

      // Check Flutterwave v3 API limit: 500,000 NGN per virtual account
      const FLUTTERWAVE_MAX_AMOUNT = 500000;
      if (amount > FLUTTERWAVE_MAX_AMOUNT) {
        setLoadingAccount(false);
        Alert.alert(
          'Amount Limit Exceeded',
          `Bank transfer is limited to ₦${FLUTTERWAVE_MAX_AMOUNT.toLocaleString()} per transaction.\n\n` +
          `Amount: ₦${amount.toLocaleString()}\n\n` +
          `Please use card payment instead.`,
          [
            { text: 'OK' },
            { 
              text: 'Use Card Instead', 
              onPress: () => navigation.navigate('CardPayment', {
                amount,
              })
            }
          ]
        );
        return;
      }

      // Check if user has authentication token
      try {
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          console.warn('User not authenticated - cannot create virtual account');
          setVirtualAccountError('Please log in to create a virtual account');
          setLoadingAccount(false);
          return;
        }
        const parsedUser = JSON.parse(userData);
        const token = parsedUser?.token || parsedUser?.accessToken;
        if (!token) {
          console.error('❌ User data exists but no token found in AsyncStorage');
          console.error('User data keys:', Object.keys(parsedUser));
          console.error('Full user object (token redacted):', { ...parsedUser, token: 'REDACTED' });
          setVirtualAccountError('Authentication token missing. Please sign out and sign in again.');
          setLoadingAccount(false);
          return;
        }
        
        // Validate token format (should be a JWT string, not an object)
        if (typeof token !== 'string' || token.trim().length === 0) {
          console.error('❌ Token is not a valid string:', typeof token, token);
          setVirtualAccountError('Invalid authentication token. Please sign out and sign in again.');
          setLoadingAccount(false);
          return;
        }
        
        console.log('✅ Token found for virtual account creation:', token.substring(0, 30) + '...');
        console.log('✅ Token length:', token.length);
        console.log('✅ Token type:', typeof token);
      } catch (authCheckError) {
        console.error('Error checking authentication:', authCheckError);
        setVirtualAccountError('Authentication check failed. Please try logging in again.');
        setLoadingAccount(false);
        return;
      }

      try {
        setLoadingAccount(true);
        
        // Generate unique transaction reference
        const generatedTxRef = `wallet_topup_${user.email}_${Date.now()}`;
        setTxRef(generatedTxRef);

        // Get user profile for name
        let userName = user?.name || 'Guest';
        try {
          const userProfile = await getUserProfile(user.email);
          if (userProfile?.name) {
            userName = userProfile.name;
          }
        } catch (profileError) {
          console.log('Could not load user profile for virtual account:', profileError);
        }

        // Create virtual account via Flutterwave for wallet funding
        console.log('🔄 Creating virtual account for wallet funding:', {
          email: user.email,
          amount: amount,
          name: userName,
          txRef: generatedTxRef
        });
        
        const accountDetails = await createVirtualAccount(
          user.email,
          amount,
          userName,
          generatedTxRef
        );

        console.log('✅ Virtual account created successfully:', accountDetails);
        console.log('✅ Account type:', typeof accountDetails);
        console.log('✅ Account keys:', accountDetails ? Object.keys(accountDetails) : 'N/A');
        
        // Handle both camelCase and snake_case response formats
        const normalizedAccount = {
          accountNumber: accountDetails?.accountNumber || accountDetails?.account_number,
          bankName: accountDetails?.bankName || accountDetails?.bank_name || 'Virtual Bank',
          accountName: accountDetails?.accountName || accountDetails?.account_name || 'Nigerian Apartments',
          txRef: accountDetails?.txRef || accountDetails?.tx_ref || generatedTxRef
        };
        
        console.log('✅ Normalized account:', normalizedAccount);
        console.log('✅ Account Number:', normalizedAccount.accountNumber);
        console.log('✅ Bank Name:', normalizedAccount.bankName);
        console.log('✅ Account Name:', normalizedAccount.accountName);
        
        if (!normalizedAccount.accountNumber) {
          console.error('❌ Account number is missing! Account details:', JSON.stringify(accountDetails, null, 2));
          throw new Error('Failed to create virtual account: Account number not found in response');
        }
        
        console.log('✅ Setting virtualAccount state...');
        setVirtualAccount(normalizedAccount);
        
        console.log('✅ virtualAccount state set. Account should now display in UI.');
      } catch (error) {
        console.error('Error creating virtual account:', error);
        
        // Provide specific error messages based on error type
        let errorMessage = error.message || 'Failed to create virtual account. Please try again or use a different payment method.';
        
        // Check for Flutterwave amount limit error
        if (error.message && (error.message.includes('500,000') || error.message.includes('500000') || error.message.includes('amount should be between'))) {
          errorMessage = `Bank transfer is limited to ₦500,000 per transaction.\n\nAmount: ₦${amount.toLocaleString()}\n\nPlease use card payment instead.`;
        } else if (error.message && (error.message.includes('Unauthorized') || error.message.includes('401') || error.message.includes('session has expired'))) {
          errorMessage = 'Your session has expired or you are not logged in. Please sign out and sign in again.';
        } else if (error.message && error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message && (error.message.includes('Flutterwave') || error.message.includes('credentials') || error.message.includes('500'))) {
          errorMessage = 'Payment service is temporarily unavailable. Please try:\n\n' +
            '1. Use card payment instead\n' +
            '2. Try again in a few minutes\n' +
            '3. Contact support if the issue persists';
        }
        
        // Set error state for UI display
        setVirtualAccountError(errorMessage);
        
        // Show error but don't block the screen - user can still see the amount and try card payment
        Alert.alert(
          'Payment Service Unavailable',
          errorMessage,
          [
            { text: 'OK' },
            { 
              text: 'Use Card Instead', 
              onPress: () => navigation.navigate('CardPayment', {
                amount,
              })
            }
          ]
        );
      } finally {
        setLoadingAccount(false);
      }
    };

    fetchVirtualAccount();
  }, [user, amount]);

  const handleCopy = async (text) => {
    try {
      // Use Clipboard API if available (Web)
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied!', 'Account details copied to clipboard');
      } else {
        // Fallback: Just show alert (clipboard copy may not be available on all platforms)
        Alert.alert('Copied!', `Account details: ${text}`);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback: Show the text in alert
      Alert.alert('Account Details', text);
    }
  };

  const handleConfirmTransfer = async () => {
    try {
      if (!user || !user.email) {
        Alert.alert('Error', 'You must be logged in to fund your wallet.');
        return;
      }

      if (!txRef || !amount) {
        Alert.alert('Error', 'Missing payment information. Please try again.');
        return;
      }

      // CRITICAL: Verify payment and automatically fund wallet
      // Poll for payment verification since bank transfers may take time
      if (txRef && amount) {
        console.log('🔄 Starting payment verification and wallet funding...');
        console.log('📋 Transaction reference:', txRef);
        
        // Show loading state
        Alert.alert(
          'Verifying Payment',
          'Please wait while we verify your bank transfer and fund your wallet...',
          [{ text: 'OK' }]
        );

        // Poll for payment verification (bank transfers may take a few seconds)
        let verificationAttempts = 0;
        const maxVerificationAttempts = 10; // Try for up to 30 seconds (3s intervals)
        let verificationSuccess = false;
        let verificationResult = null;

        while (verificationAttempts < maxVerificationAttempts && !verificationSuccess) {
          try {
            console.log(`🔄 Verification attempt ${verificationAttempts + 1}/${maxVerificationAttempts}...`);
            
            verificationResult = await verifyAndFundWallet(
              txRef,
              user.email,
              amount,
              'bank_transfer'
            );
            
            if (verificationResult.verified && verificationResult.funded) {
              verificationSuccess = true;
              console.log('✅ Payment verified and wallet funded successfully!');
              console.log('✅ Updated balance:', verificationResult.balance);
              
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
              break;
            }
          } catch (verifyError) {
            console.log(`⚠️ Verification attempt ${verificationAttempts + 1} failed:`, verifyError.message);
            
            if (verifyError.message && (
              verifyError.message.includes('not found') || 
              verifyError.message.includes('pending') ||
              verifyError.message.includes('processing')
            )) {
              verificationAttempts++;
              if (verificationAttempts < maxVerificationAttempts) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
              }
            } else {
              console.warn('⚠️ Verification error:', verifyError);
              break;
            }
          }
        }

        if (!verificationSuccess) {
          console.warn('⚠️ Payment verification timed out or failed');
          Alert.alert(
            'Payment Processing',
            'Your bank transfer is being processed. The wallet will be funded automatically once the transfer is confirmed by the bank (usually within 1-5 minutes).\n\nYou can check your wallet balance to see when the payment is credited.',
            [{ 
              text: 'OK',
              onPress: () => navigation.navigate('Wallet')
            }]
          );
        }
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error processing wallet funding:', error);
      Alert.alert('Error', 'An error occurred while funding your wallet. Please contact support.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('Wallet');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet with Transfer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Amount to Transfer */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Transfer Amount</Text>
          <Text style={styles.amountValue}>{formatPrice(totalAmount || 0)}</Text>
        </View>

        {/* Bank Account Card */}
        <View style={styles.bankCard}>
          <Text style={styles.cardTitle}>Bank Account Details</Text>
          
          {loadingAccount ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Generating virtual account...</Text>
            </View>
          ) : virtualAccountError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={24} color="#FF0000" />
              <Text style={styles.errorText}>{virtualAccountError}</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SignIn')} 
                style={styles.errorButton}
              >
                <Text style={styles.errorButtonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          ) : virtualAccount && virtualAccount.accountNumber ? (
            <>
              <View style={styles.accountDetail}>
                <Text style={styles.detailLabel}>Bank</Text>
                <Text style={styles.detailValue}>{virtualAccount.bankName || 'Virtual Bank'}</Text>
              </View>

              <View style={styles.accountDetail}>
                <Text style={styles.detailLabel}>Account Name</Text>
                <Text style={styles.detailValue}>{virtualAccount.accountName || 'Nigerian Apartments'}</Text>
              </View>

              <View style={styles.accountDetail}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <View style={styles.accountNumberRow}>
                  <Text style={styles.accountNumber}>{virtualAccount.accountNumber}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopy(virtualAccount.accountNumber)}
                  >
                    <MaterialIcons name="content-copy" size={18} color="#FFD700" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={24} color="#FF6B6B" />
              <Text style={styles.errorText}>
                Failed to load account details. Please try again or use a different payment method.
              </Text>
            </View>
          )}
        </View>

        {/* Simple Note */}
        <View style={styles.noteContainer}>
          <MaterialIcons name="info-outline" size={16} color="#666" />
          <Text style={styles.noteText}>
            {virtualAccount 
              ? "Transfer the exact amount above to the account details shown. Payment will be verified automatically once the transfer is complete."
              : "Transfer the exact amount above. Payment verification takes 1-2 business days."}
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Transfer Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, (!virtualAccount || loadingAccount) && styles.confirmButtonDisabled]}
          onPress={handleConfirmTransfer}
          activeOpacity={0.8}
          disabled={!virtualAccount || loadingAccount}
        >
          <Text style={styles.confirmButtonText}>
            {loadingAccount ? 'Loading Account Details...' : "I've Completed the Transfer"}
          </Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.successTitle}>Congratulations!</Text>
            <Text style={styles.successMessage}>
              You have successfully secured your apartment! We'll verify your payment within 1-2 business days and send you a confirmation email.
            </Text>
            <Text style={styles.successDetails}>
              {formatPrice(totalAmount || 0)}
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
    </View>
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
    paddingBottom: 100,
  },
  amountContainer: {
    padding: 24,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  bankCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  accountDetail: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6B6B',
    lineHeight: 20,
  },
  errorButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  successDetails: {
    fontSize: 20,
    fontWeight: 'bold',
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


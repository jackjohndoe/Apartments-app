import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { kycService } from '../services/kycService';
import { logger } from '../utils/logger';

const DOCUMENT_TYPES = [
  { key: 'BVN', label: 'BVN', placeholder: 'e.g. 12345678901' },
  { key: 'NIN', label: 'NIN', placeholder: 'e.g. 12345678901' },
  { key: 'PASSPORT', label: 'Passport', placeholder: 'e.g. A12345678' },
  { key: 'DRIVERS_LICENSE', label: "Driver's License", placeholder: 'e.g. AB123456' },
  { key: 'NATIONAL_ID', label: 'National ID', placeholder: 'e.g. 12345678901' },
];

const LEVEL_CONFIG = {
  UNVERIFIED: { label: 'Not Verified', color: '#F59E0B', icon: 'gpp-maybe', desc: 'Identity not verified yet' },
  PENDING: { label: 'Pending Review', color: '#F97316', icon: 'hourglass-top', desc: 'Documents under review' },
  BASIC: { label: 'Basic Verified', color: '#10B981', icon: 'verified-user', desc: 'Identity verified' },
  VERIFIED: { label: 'Fully Verified', color: '#3B82F6', icon: 'verified-user', desc: 'Identity fully verified' },
};

export default function KycScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  const [docType, setDocType] = useState('BVN');
  const [docNumber, setDocNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [bankCode, setBankCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [binding, setBinding] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const status = await kycService.getStatus();
      setKycStatus(status);
      if (status && status.level) {
        setDocType(status.documentType || 'BVN');
      }
    } catch (error) {
      logger.error('Error loading KYC status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadStatus();
    }
  }, [isFocused, loadStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatus();
  }, [loadStatus]);

  const handleSubmitKyc = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to complete verification.');
      return;
    }
    if (!docNumber || docNumber.trim().length < 6) {
      Alert.alert('Invalid Input', 'Document number must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await kycService.submitKyc({
        documentType: docType,
        documentNumber: docNumber.trim(),
      });
      setKycStatus(result);
      setDocNumber('');
      Alert.alert('Submitted', 'Your documents have been submitted for review.');
      loadStatus();
    } catch (error) {
      Alert.alert('Submission Failed', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBindBank = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to link a bank account.');
      return;
    }
    if (!bankCode || !bankCode.trim()) {
      Alert.alert('Invalid Input', 'Please enter your bank code (e.g. 044 for Access Bank).');
      return;
    }
    if (!bankAccountNumber || !/^\d{8,20}$/.test(bankAccountNumber.trim())) {
      Alert.alert('Invalid Input', 'Account number must be 8-20 digits.');
      return;
    }
    if (!bankAccountName || !bankAccountName.trim()) {
      Alert.alert('Invalid Input', 'Please enter the account holder name.');
      return;
    }
    setBinding(true);
    try {
      const result = await kycService.bindBank({
        accountBank: bankCode.trim(),
        accountNumber: bankAccountNumber.trim(),
        accountName: bankAccountName.trim(),
      });
      setKycStatus(result);
      setBankCode('');
      setBankAccountNumber('');
      setBankAccountName('');
      Alert.alert('Bank Linked', 'Your bank account has been verified and linked.');
      loadStatus();
    } catch (error) {
      Alert.alert('Link Failed', error.message || 'Please try again.');
    } finally {
      setBinding(false);
    }
  };

  const level = kycStatus?.level || 'UNVERIFIED';
  const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG.UNVERIFIED;
  const isVerified = level === 'BASIC' || level === 'VERIFIED';
  const isPending = level === 'PENDING';

  const selectedDoc = DOCUMENT_TYPES.find(d => d.key === docType) || DOCUMENT_TYPES[0];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="verified-user" size={22} color="#FFD700" />
          <Text style={styles.headerTitle}>Account Verification</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFD700']} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Checking your verification status...</Text>
          </View>
        ) : (
          <>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={[styles.statusIconContainer, { backgroundColor: levelConfig.color }]}>
                <MaterialIcons name={levelConfig.icon} size={32} color="#FFF" />
              </View>
              <Text style={[styles.statusBadge, { backgroundColor: levelConfig.color }]}>
                {levelConfig.label}
              </Text>
              <Text style={styles.statusDesc}>{levelConfig.desc}</Text>

              {kycStatus?.documentType && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusRowLabel}>Document</Text>
                  <Text style={styles.statusRowValue}>
                    {kycStatus.documentType} • {kycStatus.documentNumberMasked}
                  </Text>
                </View>
              )}
              {kycStatus?.submittedAt && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusRowLabel}>Submitted</Text>
                  <Text style={styles.statusRowValue}>
                    {new Date(kycStatus.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {kycStatus?.rejectionReason && (
                <View style={styles.rejectionCard}>
                  <MaterialIcons name="report-problem" size={18} color="#DC2626" />
                  <Text style={styles.rejectionText}>{kycStatus.rejectionReason}</Text>
                </View>
              )}
            </View>

            {/* Bound bank info */}
            {kycStatus?.boundBankAccountNumberMasked && (
              <View style={styles.bankCard}>
                <Text style={styles.bankCardTitle}>Linked Bank Account</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusRowLabel}>Bank Code</Text>
                  <Text style={styles.statusRowValue}>{kycStatus.boundBankCode}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusRowLabel}>Account Number</Text>
                  <Text style={styles.statusRowValue}>{kycStatus.boundBankAccountNumberMasked}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusRowLabel}>Account Name</Text>
                  <Text style={styles.statusRowValue}>{kycStatus.boundBankAccountName}</Text>
                </View>
                {kycStatus.boundBankVerifiedAt && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusRowLabel}>Verified On</Text>
                    <Text style={styles.statusRowValue}>
                      {new Date(kycStatus.boundBankVerifiedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* KYC submission form - only when not yet verified */}
            {!isVerified && !isPending && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Submit Your Documents</Text>
                <Text style={styles.formSubtitle}>
                  Provide a valid identity document to verify your account and enable withdrawals.
                </Text>

                <Text style={styles.label}>Document Type</Text>
                <View style={styles.chipRow}>
                  {DOCUMENT_TYPES.map(doc => (
                    <TouchableOpacity
                      key={doc.key}
                      style={[styles.chip, docType === doc.key && styles.chipSelected]}
                      onPress={() => setDocType(doc.key)}
                      disabled={submitting}
                    >
                      <Text style={[styles.chipText, docType === doc.key && styles.chipTextSelected]}>
                        {doc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Document Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder={selectedDoc.placeholder}
                  placeholderTextColor="#999"
                  value={docNumber}
                  onChangeText={setDocNumber}
                  autoCapitalize="characters"
                  editable={!submitting}
                />

                <TouchableOpacity
                  style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                  onPress={handleSubmitKyc}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <MaterialIcons name="send" size={20} color="#333" />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pending state */}
            {isPending && (
              <View style={styles.formCard}>
                <MaterialIcons name="hourglass-top" size={48} color="#F97316" />
                <Text style={styles.formTitle}>Under Review</Text>
                <Text style={styles.formSubtitle}>
                  Your documents have been submitted and are being reviewed. You will be able to
                  withdraw once your identity is verified.
                </Text>
              </View>
            )}

            {/* Bank binding form - only when verified */}
            {isVerified && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Link Bank Account</Text>
                <Text style={styles.formSubtitle}>
                  Add the bank account you want your withdrawals sent to. It must be in your own name.
                </Text>

                <Text style={styles.label}>Bank Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 044 (Access Bank)"
                  placeholderTextColor="#999"
                  value={bankCode}
                  onChangeText={setBankCode}
                  keyboardType="default"
                  editable={!binding}
                />

                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0123456789"
                  placeholderTextColor="#999"
                  value={bankAccountNumber}
                  onChangeText={setBankAccountNumber}
                  keyboardType="number-pad"
                  maxLength={20}
                  editable={!binding}
                />

                <Text style={styles.label}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#999"
                  value={bankAccountName}
                  onChangeText={setBankAccountName}
                  autoCapitalize="words"
                  editable={!binding}
                />

                <TouchableOpacity
                  style={[styles.primaryButton, binding && styles.buttonDisabled]}
                  onPress={handleBindBank}
                  disabled={binding}
                >
                  {binding ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <MaterialIcons name="account-balance" size={20} color="#333" />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {binding ? 'Verifying...' : 'Verify & Link Bank Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Info */}
            <View style={styles.infoCard}>
              <MaterialIcons name="info-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Basic verification is required to withdraw funds from your wallet. Your document
                number is stored masked and never shared.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  statusDesc: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusRowLabel: {
    fontSize: 13,
    color: '#888',
  },
  statusRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
    textAlign: 'right',
  },
  rejectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    width: '100%',
  },
  rejectionText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  bankCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bankCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'stretch',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 50,
    marginTop: 6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
});

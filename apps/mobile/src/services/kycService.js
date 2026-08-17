// KYC Service
import api from './api';
import { API_ENDPOINTS } from '../api/api';

export const kycService = {
  // Get current user's KYC status
  getStatus: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.KYC.STATUS);
      if (response === null || response === undefined) return null;
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Submit KYC documents for review
  submitKyc: async ({ documentType, documentNumber }) => {
    try {
      const response = await api.post(API_ENDPOINTS.KYC.SUBMIT, {
        documentType,
        documentNumber,
      });
      if (response === null || response === undefined) return null;
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Bind a bank account (requires Basic KYC tier or higher)
  bindBank: async ({ accountBank, accountNumber, accountName }) => {
    try {
      const response = await api.post(API_ENDPOINTS.WALLET.BIND_BANK, {
        accountBank,
        accountNumber,
        accountName,
      });
      if (response === null || response === undefined) return null;
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
};

export default kycService;

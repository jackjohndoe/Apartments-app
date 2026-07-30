import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDENTIALS_KEY = 'secure_credentials';

export const storeCredentials = async (email, password) => {
  try {
    const credentials = JSON.stringify({ email, password });
    await AsyncStorage.setItem(CREDENTIALS_KEY, credentials);
  } catch (error) {
    console.warn('Could not store credentials:', error.message);
  }
};

export const getStoredCredentials = async () => {
  try {
    const data = await AsyncStorage.getItem(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Could not retrieve credentials:', error.message);
    return null;
  }
};

export const hasStoredCredentials = async () => {
  try {
    const data = await AsyncStorage.getItem(CREDENTIALS_KEY);
    return !!data;
  } catch (error) {
    return false;
  }
};

export const clearStoredCredentials = async () => {
  try {
    await AsyncStorage.removeItem(CREDENTIALS_KEY);
  } catch (error) {
    console.warn('Could not clear credentials:', error.message);
  }
};

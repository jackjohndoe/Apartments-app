import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authService } from '../services/authService';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  useEffect(() => {
    // Extract token from route params (deep link or navigation)
    const routeToken = route.params?.token || '';
    if (routeToken) {
      setToken(routeToken);
      validateToken(routeToken);
    } else {
      // Enable manual entry mode if no token provided via link
      setValidating(false);
      setTokenValid(false);
      // Don't show error immediately, allow user to enter code
    }
  }, [route.params]);

  const validateToken = async (tokenValue) => {
    if (!tokenValue) {
      setValidating(false);
      setTokenValid(false);
      return;
    }

    setValidating(true);
    setErrorMessage(''); // Clear previous errors
    
    try {
      const response = await authService.validateResetToken(tokenValue);
      if (response?.success || response?.data?.success) {
        setTokenValid(true);
        // If we are validating a manually entered token, ensure it's set in state
        if (tokenValue !== token) {
          setToken(tokenValue);
        }
      } else {
        setTokenValid(false);
        setErrorMessage('This reset code is invalid or has expired. Please try again.');
      }
    } catch (error) {
      setTokenValid(false);
      const errorMsg = error?.message || error?.data?.message || 'Invalid or expired reset code.';
      setErrorMessage(errorMsg);
    } finally {
      setValidating(false);
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return null;
  };

  const handleManualVerify = () => {
    if (!token || !token.trim()) {
      setErrorMessage('Please enter the reset code');
      return;
    }
    validateToken(token.trim(), email);
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrorMessage('');
    setPasswordError(false);
    setConfirmPasswordError(false);

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(true);
      setErrorMessage(passwordValidation);
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(true);
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!token) {
      setErrorMessage('Reset token is missing. Please use the link from your email.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword, email);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.replace('SignIn');
            },
          },
        ]
      );
    } catch (error) {
      const errorMsg = error?.message || error?.data?.message || 'Failed to reset password. Please try again.';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Validating reset link...</Text>
        </View>
      </View>
    );
  }

  if (!tokenValid) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Enter Reset Code</Text>
            <Text style={styles.subtitle}>
              Please enter the code or token from the password reset email you received.
            </Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#FF0000" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <MaterialIcons name="vpn-key" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Reset Code / Token"
                placeholderTextColor="#999"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleManualVerify}
              disabled={validating}
            >
              {validating ? (
                <ActivityIndicator color="#333" />
              ) : (
                <Text style={styles.submitButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToSignIn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.backToSignInText}>
                Didn't receive a code? <Text style={styles.backToSignInLink}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below. Make sure it's strong and secure.
          </Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock"
              size={20}
              color={passwordError ? '#FF0000' : '#666'}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="New Password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError(false);
                setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={confirmPasswordError ? '#FF0000' : '#666'}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, confirmPasswordError && styles.inputError]}
              placeholder="Confirm New Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError(false);
                setErrorMessage('');
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.passwordHint}>
            Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.
          </Text>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#FF0000" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#333" />
            ) : (
              <Text style={styles.submitButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToSignIn}
            onPress={() => navigation.replace('SignIn')}
          >
            <Text style={styles.backToSignInText}>
              Remember your password? <Text style={styles.backToSignInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    marginTop: 50,
    marginLeft: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  errorIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  eyeIcon: {
    marginRight: 16,
    padding: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  backToSignIn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToSignInText: {
    color: '#666',
    fontSize: 14,
  },
  backToSignInLink: {
    color: '#FFD700',
    fontWeight: '600',
  },
});


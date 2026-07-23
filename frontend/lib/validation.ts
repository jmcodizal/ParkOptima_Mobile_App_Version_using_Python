/**
 * Validation utilities for ParkOptima forms
 */

export const ValidationRules = {
  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email must be in format like attendant@gmail.com',
    validate: (email: string): { valid: boolean; message: string } => {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return { valid: false, message: 'Email is required' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { valid: false, message: 'Email must be in format like attendant@gmail.com' };
      }
      return { valid: true, message: '' };
    },
  },

  // Password validation
  password: {
    minLength: 6,
    requireNumber: true,
    requireSpecialChar: true,
    message: 'Password must be at least 6 characters with 1 number and 1 special character',
    validate: (password: string): { valid: boolean; message: string; errors: string[] } => {
      const errors: string[] = [];

      if (!password) {
        return { valid: false, message: 'Password is required', errors: ['Password is required'] };
      }

      if (password.length < 6) {
        errors.push('At least 6 characters');
      }

      if (!/\d/.test(password)) {
        errors.push('At least 1 number');
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('At least 1 special character (!@#$%^&* etc)');
      }

      if (errors.length > 0) {
        return {
          valid: false,
          message: 'Password must contain:',
          errors,
        };
      }

      return { valid: true, message: '', errors: [] };
    },
  },

  // Phone validation
  phone: {
    length: 11,
    prefix: '09',
    pattern: /^09\d{9}$/,
    message: 'Phone number must be 11 digits starting with 09',
    validate: (phone: string): { valid: boolean; message: string } => {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        return { valid: false, message: 'Phone number is required' };
      }
      if (!/^09\d{9}$/.test(trimmedPhone)) {
        return { valid: false, message: 'Phone number must be 11 digits starting with 09' };
      }
      return { valid: true, message: '' };
    },
  },

  // PIN validation (4 digits)
  pin: {
    length: 4,
    pattern: /^[0-9]{4}$/,
    message: 'PIN must be exactly 4 digits',
    validate: (pin: string): { valid: boolean; message: string } => {
      if (!pin) {
        return { valid: false, message: 'PIN is required' };
      }
      if (!/^[0-9]{4}$/.test(pin)) {
        return { valid: false, message: 'PIN must be exactly 4 digits' };
      }
      return { valid: true, message: '' };
    },
  },
};

// Helper function to check if phone is valid (optional field)
export const isValidPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === '') {
    return true; // Optional field
  }
  return ValidationRules.phone.validate(phone).valid;
};

// Helper function to check if email is valid
export const isValidEmail = (email: string): boolean => {
  return ValidationRules.email.validate(email).valid;
};

// Helper function to check if password is valid
export const isValidPassword = (password: string): boolean => {
  return ValidationRules.password.validate(password).valid;
};

// Helper function to check if PIN is valid
export const isValidPin = (pin: string): boolean => {
  return ValidationRules.pin.validate(pin).valid;
};

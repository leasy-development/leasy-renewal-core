import { validationPatterns } from './securityHeaders';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Check length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  // Check against common passwords (basic check)
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a more unique password');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 10) {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export function sanitizeInput(input: string): string {
  // Remove potential XSS characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function validateEmail(email: string): boolean {
  return validationPatterns.email.test(email);
}
// Single source of truth for the password policy (mirrored in
// client/src/utils/passwordRules.js): 8–20 chars + uppercase + number + special.
export const validatePassword = (pw) => {
  const value = String(pw || '');
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters long';
  if (value.length > 20) return 'Password must be at most 20 characters long';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter (A-Z)';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number (0-9)';
  if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
  return null;
};
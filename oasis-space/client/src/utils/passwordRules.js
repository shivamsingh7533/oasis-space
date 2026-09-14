export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 20;

const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*]/;

// Returns an error message, or null when the password is valid.
// Mirrors server-side validation exactly (auth.controller.js, user.controller.js).
export const passwordError = (pw) => {
  const value = String(pw || '');
  if (!value) return 'Password is required';
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters long`;
  if (value.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters long`;
  if (!HAS_UPPER.test(value)) return 'Password must contain at least one uppercase letter (A-Z)';
  if (!HAS_DIGIT.test(value)) return 'Password must contain at least one number (0-9)';
  if (!HAS_SPECIAL.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
  return null;
};
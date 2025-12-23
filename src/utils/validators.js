// ============================================
// Input Validators
// ============================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  if (email.length > 255) return 'Email is too long';
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 100) return 'Password is too long';
  return null;
};

const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 100) return 'Name is too long';
  return null;
};

const validateRegisterInput = (data) => {
  const { name, email, password } = data;
  const errors = [];
  
  const nameError = validateName(name);
  if (nameError) errors.push(nameError);
  
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);
  
  return errors.length > 0 ? errors : null;
};

const validateLoginInput = (data) => {
  const { email, password } = data;
  const errors = [];
  
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);
  
  return errors.length > 0 ? errors : null;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateRegisterInput,
  validateLoginInput,
  emailRegex
};
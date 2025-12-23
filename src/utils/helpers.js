// ============================================
// Utility Functions
// ============================================

// Format response
const formatResponse = (data, message = 'Success', status = 'success') => {
  return {
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Handle errors
const handleError = (error, customMessage = null) => {
  console.error('Error:', error);
  
  return {
    status: 'error',
    message: customMessage || error.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  formatResponse,
  handleError
};
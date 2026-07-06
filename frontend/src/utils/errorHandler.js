import toast from 'react-hot-toast';

/**
 * Get a user-friendly error message from an API error
 */
export const getErrorMessage = (error) => {
  // Network errors (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return '⏱️ Request timed out. Please check your internet connection and try again.';
    }
    return '🔌 Unable to connect to the server. Please check your internet connection.';
  }

  const { status, data } = error.response;
  const serverMessage = data?.error || data?.message;

  // Server error messages
  switch (status) {
    case 400:
      return serverMessage || '❌ Invalid request. Please check your input and try again.';
    case 401:
      return '🔐 Authentication required. Please connect your wallet and try again.';
    case 403:
      return '⛔ You don\'t have permission to perform this action.';
    case 404:
      return '🔍 Resource not found. Please refresh and try again.';
    case 429:
      return serverMessage || '🐢 Too many requests. Please slow down and try again in a moment.';
    case 500:
      return '💥 Something went wrong on our end. Please try again later.';
    default:
      return serverMessage || `⚠️ An unexpected error occurred (${status}). Please try again.`;
  }
};

/**
 * Show a user-friendly toast notification for an error
 */
export const showErrorToast = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
  const message = getErrorMessage(error) || fallbackMessage;
  
  toast.error(message, {
    duration: 5000,
    style: {
      background: '#1a0a0a',
      color: '#ff6b6b',
      border: '1px solid rgba(255,0,0,0.2)',
      borderRadius: '12px',
      boxShadow: '0 0 30px rgba(255,0,0,0.1)',
    },
    icon: '❌',
  });

  // Log error to console for debugging
  console.error('Error:', error);
};

/**
 * Wrap an API call with error handling
 */
export const withErrorHandling = (apiCall, fallbackMessage) => {
  return async (...args) => {
    try {
      const response = await apiCall(...args);
      return response;
    } catch (error) {
      showErrorToast(error, fallbackMessage);
      throw error;
    }
  };
};

/**
 * Custom hook for error handling in components
 */
export const useErrorHandler = () => {
  return { getErrorMessage, showErrorToast, withErrorHandling };
};

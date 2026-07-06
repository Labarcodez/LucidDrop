// Google Analytics 4 measurement ID from environment variables
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_TRACKING_ID || '';

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }
};

export const trackEvent = (event, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params);
  }
};
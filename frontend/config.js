// Configuration for API endpoints
// This file is loaded before app.js and sets the API base URL

(function() {
  // Determine if we're running locally or on GitHub Pages
  const isLocal = window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === 'localhost' ||
                  window.location.protocol === 'file:';
  
  // For local development, use local backend
  // For GitHub Pages, you can set your deployed backend URL here
  // or use a demo/mock API endpoint
  window.__CONFIG__ = {
    API_BASE: isLocal 
      ? 'http://127.0.0.1:5000'
      : 'http://127.0.0.1:5000'  // Change this to your deployed backend URL or leave for demo mode
  };
  
  console.log('API Base URL:', window.__CONFIG__.API_BASE);
})();

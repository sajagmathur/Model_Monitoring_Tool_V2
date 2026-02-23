// Configuration for API endpoints
// This file is loaded before app.js and sets the API base URL

(function() {
  // Determine if we're running locally or on GitHub Pages
  const isLocal = window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === 'localhost' ||
                  window.location.protocol === 'file:';
  
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // For local development, use local backend
  // For GitHub Pages, the backend API must be deployed separately and accessible via HTTPS
  // You can set the deployed backend URL here as an environment variable or hardcode it
  let apiBase = 'http://127.0.0.1:5000';
  
  if (isGitHubPages) {
    // GitHub Pages deployment - requires external backend
    // Option 1: Set a deployed API endpoint (e.g., Heroku, Vercel, AWS, etc.)
    // apiBase = 'https://your-deployed-backend-api.com';
    
    // Option 2: Use environment variable if available (for build-time configuration)
    apiBase = process.env.VITE_API_URL || 'http://127.0.0.1:5000';
  }
  
  window.__CONFIG__ = {
    API_BASE: apiBase,
    isGitHubPages: isGitHubPages,
    isLocal: isLocal
  };
  
  console.log('Environment:', { 
    hostname: window.location.hostname,
    isLocal,
    isGitHubPages,
    apiBase 
  });
})();

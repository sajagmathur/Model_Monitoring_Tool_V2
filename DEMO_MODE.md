# Demo Mode & GitHub Pages Deployment

## Overview

The Model Monitoring Tool frontend now supports **Demo Mode** with built-in mock data. This allows the frontend to run fully functional without a backend API, making it perfect for GitHub Pages deployment.

## How It Works

### Automatic Fallback
The frontend automatically detects if the backend API is unavailable and seamlessly switches to demo mode:
- **Live Mode**: When backend API is reachable, uses real data
- **Demo Mode**: When backend API is unavailable, uses comprehensive mock data

### Mock Data Includes
- **6 Sample Models**: Acquisition, ECM, Collections, Fraud models
- **Summary Metrics**: KS, PSI, AUC, Gini, and model-specific metrics
- **Detailed Views**: Decile analysis, feature importance, explainability
- **Trend Charts**: Multi-vintage performance trends
- **Variable Stability**: PSI tracking for input variables
- **Segment Analysis**: Thin file vs thick file performance
- **Workflow Demo**: Full data upload → QC → scoring → metrics workflow

## Usage Scenarios

### 1. Local Development (Full Functionality)
Run both backend and frontend:
```powershell
.\run_app.ps1
# Opens http://127.0.0.1:8080 with live backend
```

### 2. GitHub Pages (Demo Mode)
Push to GitHub and it auto-deploys as a live demo:
- Frontend displays full functionality with mock data
- Perfect for presentations, demos, portfolio
- No backend deployment needed

### 3. Production with Deployed Backend
Deploy backend separately (Heroku, AWS, etc.) and configure:
```javascript
// In frontend/config.js
apiBase = 'https://your-backend-api.com';
```

## Files Added

- **`frontend/mock-data.js`**: Comprehensive mock data module
  - Filter options, models, metrics
  - Trends, deciles, explainability
  - Workflow simulation
  
- **`frontend/config.js`**: Environment configuration
  - Detects GitHub Pages vs local
  - Configures API endpoints

## Modified Files

- **`frontend/app.js`**: Updated all API functions
  - Try backend first, fallback to mock
  - Display demo mode indicator
  
- **`frontend/index.html`**: Load config and mock data
- **`frontend/backend-portal.html`**: Support demo mode
- **`.github/workflows/deploy-to-pages.yml`**: Simplified deployment

## Demo Mode Indicator

When in demo mode, a blue banner appears at top:
```
📊 Demo Mode: Displaying sample data. To use live data, run run_app.ps1 locally...
```

## All Features Work in Demo Mode

✅ Dashboard with metrics summary  
✅ Filter by portfolio, model type, vintage  
✅ Detailed model views with deciles  
✅ KS/PSI/Volume trend charts  
✅ ML explainability (feature importance)  
✅ Variable stability analysis  
✅ Segment-level metrics  
✅ Data workflow (upload → QC → score → compute)  
✅ Excel/PowerPoint export  
✅ RAG status indicators  

## GitHub Pages Deployment

1. Push code to GitHub:
   ```powershell
   git add .
   git commit -m "Add demo mode for GitHub Pages"
   git push
   ```

2. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - The workflow will auto-deploy

3. Access your demo:
   ```
   https://yourusername.github.io/your-repo-name/
   ```

## Benefits

- **No Backend Required**: GitHub Pages hosts static files only
- **Full Demo**: All features visible and interactive
- **Cost Effective**: Free hosting with GitHub Pages
- **Portfolio Ready**: Perfect for showcasing your work
- **Easy Presentations**: Share live link instead of screenshots

## Notes

- Mock data is realistic and comprehensive
- Workflow creates simulated datasets
- All charts and visualizations work
- Backend still required for production use with real data

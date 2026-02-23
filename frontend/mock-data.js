// Mock data for demo mode when backend API is unavailable
// This provides a full demonstration of all features without requiring a backend

const MOCK_DATA = {
  // Filter options
  filterOptions: {
    portfolios: ['Acquisition', 'ECM', 'Collections'],
    model_types: ['Scorecard', 'ML', 'Fraud', 'Collections'],
    vintages: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1'],
    segments: ['thin_file', 'thick_file']
  },

  // Models list
  models: [
    { model_id: 'ACQ-RET-001', portfolio: 'Acquisition', model_type: 'Scorecard' },
    { model_id: 'ACQ-RET-002', portfolio: 'Acquisition', model_type: 'ML' },
    { model_id: 'ECM-LIMIT-001', portfolio: 'ECM', model_type: 'Scorecard' },
    { model_id: 'FRD-TXN-001', portfolio: 'Acquisition', model_type: 'Fraud' },
    { model_id: 'COL-RISK-001', portfolio: 'Collections', model_type: 'Collections' },
    { model_id: 'ACQ-ML-003', portfolio: 'Acquisition', model_type: 'ML' }
  ],

  // Summary metrics
  summaryMetrics: [
    {
      model_id: 'ACQ-RET-001',
      portfolio: 'Acquisition',
      model_type: 'Scorecard',
      vintage: '2025-Q1',
      segment: null,
      metrics: {
        KS: 0.4523,
        PSI: 0.0234,
        AUC: 0.8245,
        Gini: 0.6490,
        bad_rate: 0.0456,
        CA_at_10: 0.3421
      }
    },
    {
      model_id: 'ACQ-RET-001',
      portfolio: 'Acquisition',
      model_type: 'Scorecard',
      vintage: '2024-Q4',
      segment: null,
      metrics: {
        KS: 0.4489,
        PSI: 0.0198,
        AUC: 0.8198,
        Gini: 0.6396,
        bad_rate: 0.0442,
        CA_at_10: 0.3387
      }
    },
    {
      model_id: 'ACQ-RET-002',
      portfolio: 'Acquisition',
      model_type: 'ML',
      vintage: '2025-Q1',
      segment: null,
      metrics: {
        KS: 0.5234,
        PSI: 0.0456,
        AUC: 0.8756,
        Gini: 0.7512,
        bad_rate: 0.0423,
        accuracy: 0.9123,
        precision: 0.8456,
        recall: 0.7890
      }
    },
    {
      model_id: 'ECM-LIMIT-001',
      portfolio: 'ECM',
      model_type: 'Scorecard',
      vintage: '2025-Q1',
      segment: null,
      metrics: {
        KS: 0.3876,
        PSI: 0.0312,
        AUC: 0.7654,
        Gini: 0.5308,
        bad_rate: 0.0512
      }
    },
    {
      model_id: 'FRD-TXN-001',
      portfolio: 'Acquisition',
      model_type: 'Fraud',
      vintage: '2025-Q1',
      segment: null,
      metrics: {
        KS: 0.6234,
        PSI: 0.0189,
        AUC: 0.9123,
        Gini: 0.8246,
        fraud_detection_rate: 0.8945,
        false_positive_rate: 0.0234
      }
    },
    {
      model_id: 'COL-RISK-001',
      portfolio: 'Collections',
      model_type: 'Collections',
      vintage: '2025-Q1',
      segment: null,
      metrics: {
        KS: 0.4123,
        PSI: 0.0267,
        AUC: 0.7987,
        Gini: 0.5974,
        recovery_rate: 0.6234,
        contact_rate: 0.7456
      }
    },
    {
      model_id: 'ACQ-ML-003',
      portfolio: 'Acquisition',
      model_type: 'ML',
      vintage: '2025-Q1',
      segment: null,
      metrics: {
        KS: 0.4987,
        PSI: 0.0523,
        AUC: 0.8567,
        Gini: 0.7134,
        bad_rate: 0.0467
      }
    }
  ],

  // Detailed metrics with deciles and explainability
  detailMetrics: {
    'ACQ-RET-001': {
      model_id: 'ACQ-RET-001',
      portfolio: 'Acquisition',
      model_type: 'Scorecard',
      vintage: '2025-Q1',
      metrics: {
        KS: 0.4523,
        PSI: 0.0234,
        AUC: 0.8245,
        Gini: 0.6490,
        bad_rate: 0.0456,
        CA_at_10: 0.3421,
        approval_rate: 0.7234,
        volume: 15234
      },
      deciles: [
        { decile: 1, count: 1523, bad_count: 198, bad_rate: 0.1300 },
        { decile: 2, count: 1524, bad_count: 152, bad_rate: 0.0997 },
        { decile: 3, count: 1523, bad_count: 121, bad_rate: 0.0794 },
        { decile: 4, count: 1523, bad_count: 95, bad_rate: 0.0623 },
        { decile: 5, count: 1524, bad_count: 76, bad_rate: 0.0498 },
        { decile: 6, count: 1523, bad_count: 61, bad_rate: 0.0400 },
        { decile: 7, count: 1524, bad_count: 46, bad_rate: 0.0301 },
        { decile: 8, count: 1523, bad_count: 31, bad_rate: 0.0203 },
        { decile: 9, count: 1524, bad_count: 18, bad_rate: 0.0118 },
        { decile: 10, count: 1523, bad_count: 8, bad_rate: 0.0052 }
      ],
      decile_commentary: 'Model shows strong rank ordering with top decile capturing 13% bad rate vs 0.5% in bottom decile. PSI within acceptable range.'
    },
    'ACQ-RET-002': {
      model_id: 'ACQ-RET-002',
      portfolio: 'Acquisition',
      model_type: 'ML',
      vintage: '2025-Q1',
      metrics: {
        KS: 0.5234,
        PSI: 0.0456,
        AUC: 0.8756,
        Gini: 0.7512,
        bad_rate: 0.0423,
        accuracy: 0.9123,
        precision: 0.8456,
        recall: 0.7890
      },
      deciles: [
        { decile: 1, count: 2145, bad_count: 289, bad_rate: 0.1347 },
        { decile: 2, count: 2146, bad_count: 193, bad_rate: 0.0899 },
        { decile: 3, count: 2145, bad_count: 143, bad_rate: 0.0666 },
        { decile: 4, count: 2145, bad_count: 107, bad_rate: 0.0498 },
        { decile: 5, count: 2146, bad_count: 79, bad_rate: 0.0368 },
        { decile: 6, count: 2145, bad_count: 58, bad_rate: 0.0270 },
        { decile: 7, count: 2146, bad_count: 41, bad_rate: 0.0191 },
        { decile: 8, count: 2145, bad_count: 26, bad_rate: 0.0121 },
        { decile: 9, count: 2146, bad_count: 15, bad_rate: 0.0069 },
        { decile: 10, count: 2145, bad_count: 7, bad_rate: 0.0032 }
      ],
      explainability: {
        feature_importance: [
          { feature: 'credit_score', importance: 0.2845 },
          { feature: 'debt_to_income', importance: 0.1923 },
          { feature: 'payment_history', importance: 0.1534 },
          { feature: 'account_age', importance: 0.1287 },
          { feature: 'utilization_rate', importance: 0.0987 },
          { feature: 'recent_inquiries', importance: 0.0823 },
          { feature: 'number_of_accounts', importance: 0.0601 }
        ],
        importance_drift: 0.0234
      },
      decile_commentary: 'ML model demonstrates excellent discrimination. Feature importance stable with credit_score as primary driver.'
    },
    'ECM-LIMIT-001': {
      model_id: 'ECM-LIMIT-001',
      portfolio: 'ECM',
      model_type: 'Scorecard',
      vintage: '2025-Q1',
      metrics: {
        KS: 0.3876,
        PSI: 0.0312,
        AUC: 0.7654,
        Gini: 0.5308,
        bad_rate: 0.0512,
        approval_rate: 0.8234
      },
      deciles: [
        { decile: 1, count: 892, bad_count: 98, bad_rate: 0.1098 },
        { decile: 2, count: 893, bad_count: 76, bad_rate: 0.0851 },
        { decile: 3, count: 892, bad_count: 62, bad_rate: 0.0695 },
        { decile: 4, count: 892, bad_count: 51, bad_rate: 0.0571 },
        { decile: 5, count: 893, bad_count: 43, bad_rate: 0.0481 },
        { decile: 6, count: 892, bad_count: 36, bad_rate: 0.0403 },
        { decile: 7, count: 893, bad_count: 29, bad_rate: 0.0324 },
        { decile: 8, count: 892, bad_count: 22, bad_rate: 0.0246 },
        { decile: 9, count: 893, bad_count: 16, bad_rate: 0.0179 },
        { decile: 10, count: 892, bad_count: 11, bad_rate: 0.0123 }
      ],
      decile_commentary: 'ECM model showing moderate discrimination. PSI slightly elevated but within monitoring threshold.'
    },
    'FRD-TXN-001': {
      model_id: 'FRD-TXN-001',
      portfolio: 'Acquisition',
      model_type: 'Fraud',
      vintage: '2025-Q1',
      metrics: {
        KS: 0.6234,
        PSI: 0.0189,
        AUC: 0.9123,
        Gini: 0.8246,
        fraud_detection_rate: 0.8945,
        false_positive_rate: 0.0234,
        precision: 0.9234,
        recall: 0.8945
      },
      deciles: [
        { decile: 1, count: 3421, bad_count: 687, bad_rate: 0.2008 },
        { decile: 2, count: 3422, bad_count: 445, bad_rate: 0.1300 },
        { decile: 3, count: 3421, bad_count: 274, bad_rate: 0.0800 },
        { decile: 4, count: 3421, bad_count: 171, bad_rate: 0.0499 },
        { decile: 5, count: 3422, bad_count: 103, bad_rate: 0.0301 },
        { decile: 6, count: 3421, bad_count: 62, bad_rate: 0.0181 },
        { decile: 7, count: 3422, bad_count: 34, bad_rate: 0.0099 },
        { decile: 8, count: 3421, bad_count: 17, bad_rate: 0.0049 },
        { decile: 9, count: 3422, bad_count: 7, bad_rate: 0.0020 },
        { decile: 10, count: 3421, bad_count: 3, bad_rate: 0.0008 }
      ],
      decile_commentary: 'Fraud model performing exceptionally well. High detection rate with low false positives. Stable PSI indicates consistent scoring.'
    },
    'COL-RISK-001': {
      model_id: 'COL-RISK-001',
      portfolio: 'Collections',
      model_type: 'Collections',
      vintage: '2025-Q1',
      metrics: {
        KS: 0.4123,
        PSI: 0.0267,
        AUC: 0.7987,
        Gini: 0.5974,
        recovery_rate: 0.6234,
        contact_rate: 0.7456,
        promise_to_pay_rate: 0.4523
      },
      deciles: [
        { decile: 1, count: 1234, bad_count: 179, bad_rate: 0.1450 },
        { decile: 2, count: 1235, bad_count: 136, bad_rate: 0.1101 },
        { decile: 3, count: 1234, bad_count: 111, bad_rate: 0.0899 },
        { decile: 4, count: 1234, bad_count: 93, bad_rate: 0.0753 },
        { decile: 5, count: 1235, bad_count: 77, bad_rate: 0.0623 },
        { decile: 6, count: 1234, bad_count: 62, bad_rate: 0.0502 },
        { decile: 7, count: 1235, bad_count: 49, bad_rate: 0.0396 },
        { decile: 8, count: 1234, bad_count: 37, bad_rate: 0.0299 },
        { decile: 9, count: 1235, bad_count: 25, bad_rate: 0.0202 },
        { decile: 10, count: 1234, bad_count: 15, bad_rate: 0.0121 }
      ],
      decile_commentary: 'Collections model showing good segmentation capability. Recovery rates higher in lower risk deciles as expected.'
    },
    'ACQ-ML-003': {
      model_id: 'ACQ-ML-003',
      portfolio: 'Acquisition',
      model_type: 'ML',
      vintage: '2025-Q1',
      metrics: {
        KS: 0.4987,
        PSI: 0.0523,
        AUC: 0.8567,
        Gini: 0.7134,
        bad_rate: 0.0467,
        accuracy: 0.8934,
        precision: 0.8123,
        recall: 0.7654
      },
      deciles: [
        { decile: 1, count: 1876, bad_count: 244, bad_rate: 0.1300 },
        { decile: 2, count: 1877, bad_count: 169, bad_rate: 0.0900 },
        { decile: 3, count: 1876, bad_count: 131, bad_rate: 0.0698 },
        { decile: 4, count: 1876, bad_count: 100, bad_rate: 0.0533 },
        { decile: 5, count: 1877, bad_count: 75, bad_rate: 0.0399 },
        { decile: 6, count: 1876, bad_count: 56, bad_rate: 0.0298 },
        { decile: 7, count: 1877, bad_count: 39, bad_rate: 0.0207 },
        { decile: 8, count: 1876, bad_count: 26, bad_rate: 0.0138 },
        { decile: 9, count: 1877, bad_count: 15, bad_rate: 0.0079 },
        { decile: 10, count: 1876, bad_count: 7, bad_rate: 0.0037 }
      ],
      explainability: {
        feature_importance: [
          { feature: 'bureau_score', importance: 0.3123 },
          { feature: 'income_stability', importance: 0.1876 },
          { feature: 'existing_obligations', importance: 0.1543 },
          { feature: 'employment_tenure', importance: 0.1234 },
          { feature: 'residential_stability', importance: 0.0987 },
          { feature: 'credit_mix', importance: 0.0765 },
          { feature: 'recent_credit_behavior', importance: 0.0472 }
        ],
        importance_drift: 0.0412
      },
      decile_commentary: 'ML model with elevated PSI - requires monitoring. Good discrimination maintained but distribution shift detected.'
    }
  },

  // Trends data
  trends: {
    'ACQ-RET-001': {
      model_id: 'ACQ-RET-001',
      trends: [
        { vintage: '2024-Q1', KS: 0.4456, PSI: 0.0187, volume: 14523, bad_rate: 0.0478 },
        { vintage: '2024-Q2', KS: 0.4489, PSI: 0.0212, volume: 15234, bad_rate: 0.0465 },
        { vintage: '2024-Q3', KS: 0.4512, PSI: 0.0198, volume: 14987, bad_rate: 0.0451 },
        { vintage: '2024-Q4', KS: 0.4489, PSI: 0.0198, volume: 15456, bad_rate: 0.0442 },
        { vintage: '2025-Q1', KS: 0.4523, PSI: 0.0234, volume: 15234, bad_rate: 0.0456 }
      ]
    },
    'ACQ-RET-002': {
      model_id: 'ACQ-RET-002',
      trends: [
        { vintage: '2024-Q1', KS: 0.5123, PSI: 0.0389, volume: 20123, bad_rate: 0.0445 },
        { vintage: '2024-Q2', KS: 0.5189, PSI: 0.0412, volume: 21456, bad_rate: 0.0432 },
        { vintage: '2024-Q3', KS: 0.5212, PSI: 0.0434, volume: 21234, bad_rate: 0.0428 },
        { vintage: '2024-Q4', KS: 0.5198, PSI: 0.0445, volume: 21897, bad_rate: 0.0419 },
        { vintage: '2025-Q1', KS: 0.5234, PSI: 0.0456, volume: 21456, bad_rate: 0.0423 }
      ]
    },
    'ECM-LIMIT-001': {
      model_id: 'ECM-LIMIT-001',
      trends: [
        { vintage: '2024-Q1', KS: 0.3923, PSI: 0.0287, volume: 8734, bad_rate: 0.0534 },
        { vintage: '2024-Q2', KS: 0.3898, PSI: 0.0298, volume: 8923, bad_rate: 0.0523 },
        { vintage: '2024-Q3', KS: 0.3867, PSI: 0.0305, volume: 8812, bad_rate: 0.0518 },
        { vintage: '2024-Q4', KS: 0.3889, PSI: 0.0312, volume: 9012, bad_rate: 0.0515 },
        { vintage: '2025-Q1', KS: 0.3876, PSI: 0.0312, volume: 8923, bad_rate: 0.0512 }
      ]
    },
    'FRD-TXN-001': {
      model_id: 'FRD-TXN-001',
      trends: [
        { vintage: '2024-Q1', KS: 0.6189, PSI: 0.0145, volume: 32456, bad_rate: 0.0523 },
        { vintage: '2024-Q2', KS: 0.6212, PSI: 0.0167, volume: 33123, bad_rate: 0.0512 },
        { vintage: '2024-Q3', KS: 0.6198, PSI: 0.0178, volume: 33897, bad_rate: 0.0506 },
        { vintage: '2024-Q4', KS: 0.6223, PSI: 0.0183, volume: 34123, bad_rate: 0.0501 },
        { vintage: '2025-Q1', KS: 0.6234, PSI: 0.0189, volume: 34210, bad_rate: 0.0498 }
      ]
    },
    'COL-RISK-001': {
      model_id: 'COL-RISK-001',
      trends: [
        { vintage: '2024-Q1', KS: 0.4089, PSI: 0.0234, volume: 11234, bad_rate: 0.0789 },
        { vintage: '2024-Q2', KS: 0.4112, PSI: 0.0245, volume: 11567, bad_rate: 0.0767 },
        { vintage: '2024-Q3', KS: 0.4098, PSI: 0.0256, volume: 11789, bad_rate: 0.0756 },
        { vintage: '2024-Q4', KS: 0.4134, PSI: 0.0261, volume: 12012, bad_rate: 0.0745 },
        { vintage: '2025-Q1', KS: 0.4123, PSI: 0.0267, volume: 12340, bad_rate: 0.0738 }
      ]
    },
    'ACQ-ML-003': {
      model_id: 'ACQ-ML-003',
      trends: [
        { vintage: '2024-Q1', KS: 0.4923, PSI: 0.0412, volume: 18234, bad_rate: 0.0489 },
        { vintage: '2024-Q2', KS: 0.4945, PSI: 0.0445, volume: 18567, bad_rate: 0.0478 },
        { vintage: '2024-Q3', KS: 0.4967, PSI: 0.0478, volume: 18789, bad_rate: 0.0472 },
        { vintage: '2024-Q4', KS: 0.4978, PSI: 0.0501, volume: 18923, bad_rate: 0.0469 },
        { vintage: '2025-Q1', KS: 0.4987, PSI: 0.0523, volume: 18760, bad_rate: 0.0467 }
      ]
    }
  },

  // Variable stability data
  variableStability: {
    'ACQ-RET-001': {
      variables: [
        { variable: 'credit_score', psi: 0.0234, mean_dev: 678.4, mean_prod: 682.1, drift: 0.0054 },
        { variable: 'debt_to_income', psi: 0.0189, mean_dev: 0.342, mean_prod: 0.338, drift: -0.0117 },
        { variable: 'payment_history', psi: 0.0312, mean_dev: 0.876, mean_prod: 0.889, drift: 0.0148 },
        { variable: 'account_age', psi: 0.0156, mean_dev: 4.5, mean_prod: 4.6, drift: 0.0222 },
        { variable: 'utilization_rate', psi: 0.0278, mean_dev: 0.456, mean_prod: 0.442, drift: -0.0307 }
      ]
    },
    'ACQ-RET-002': {
      variables: [
        { variable: 'credit_score', psi: 0.0456, mean_dev: 685.3, mean_prod: 691.2, drift: 0.0086 },
        { variable: 'debt_to_income', psi: 0.0389, mean_dev: 0.328, mean_prod: 0.319, drift: -0.0274 },
        { variable: 'payment_history', psi: 0.0412, mean_dev: 0.891, mean_prod: 0.903, drift: 0.0135 },
        { variable: 'account_age', psi: 0.0367, mean_dev: 4.7, mean_prod: 4.9, drift: 0.0426 },
        { variable: 'utilization_rate', psi: 0.0434, mean_dev: 0.442, mean_prod: 0.429, drift: -0.0294 },
        { variable: 'recent_inquiries', psi: 0.0523, mean_dev: 2.3, mean_prod: 2.6, drift: 0.1304 }
      ]
    }
  },

  // Segment-level metrics
  segmentMetrics: {
    'ACQ-RET-001': {
      segments: [
        {
          segment: 'thin_file',
          metrics: { KS: 0.3876, PSI: 0.0345, AUC: 0.7654, bad_rate: 0.0687, volume: 4523 }
        },
        {
          segment: 'thick_file',
          metrics: { KS: 0.4923, PSI: 0.0189, AUC: 0.8567, bad_rate: 0.0345, volume: 10711 }
        }
      ]
    },
    'ACQ-RET-002': {
      segments: [
        {
          segment: 'thin_file',
          metrics: { KS: 0.4567, PSI: 0.0523, AUC: 0.8234, bad_rate: 0.0634, volume: 6234 }
        },
        {
          segment: 'thick_file',
          metrics: { KS: 0.5623, PSI: 0.0398, AUC: 0.9012, bad_rate: 0.0312, volume: 15222 }
        }
      ]
    }
  },

  // Dataset tracking for workflow
  datasets: {},
  nextDatasetId: 1
};

// Mock API functions
window.MOCK_API = {
  // Check if we should use mock data
  shouldUseMock: function() {
    // Use mock if backend is unavailable or if explicitly on GitHub Pages
    const isGitHubPages = (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.isGitHubPages);
    return isGitHubPages || window.__FORCE_MOCK__ === true;
  },

  getFilterOptions: async function() {
    await this._delay();
    return MOCK_DATA.filterOptions;
  },

  getModels: async function() {
    await this._delay();
    return { models: MOCK_DATA.models };
  },

  getSummary: async function(params = {}) {
    await this._delay();
    let filtered = [...MOCK_DATA.summaryMetrics];
    
    if (params.portfolio) {
      filtered = filtered.filter(m => m.portfolio === params.portfolio);
    }
    if (params.model_type) {
      filtered = filtered.filter(m => m.model_type === params.model_type);
    }
    if (params.vintage) {
      filtered = filtered.filter(m => m.vintage === params.vintage);
    }
    if (params.segment) {
      filtered = filtered.filter(m => m.segment === params.segment);
    }
    
    return { metrics: filtered };
  },

  getDetail: async function(modelId, vintage, segment) {
    await this._delay();
    const detail = MOCK_DATA.detailMetrics[modelId];
    if (!detail) {
      throw new Error('Model not found');
    }
    return detail;
  },

  getTrends: async function(modelId, segment) {
    await this._delay();
    const trendsData = MOCK_DATA.trends[modelId];
    if (!trendsData) {
      // Return default structure if no data found
      return {
        model_id: modelId,
        vintages: [],
        ks: [],
        psi: [],
        volume: [],
        bad_rate: []
      };
    }
    // Transform from array format to separate arrays
    const trends = trendsData.trends || [];
    return {
      model_id: modelId,
      vintages: trends.map(t => t.vintage),
      ks: trends.map(t => t.KS),
      psi: trends.map(t => t.PSI),
      volume: trends.map(t => t.volume),
      bad_rate: trends.map(t => t.bad_rate)
    };
  },

  getVariableStability: async function(modelId, vintage) {
    await this._delay();
    const stability = MOCK_DATA.variableStability[modelId];
    if (!stability) {
      return { variables: [] };
    }
    return stability;
  },

  getSegmentMetrics: async function(modelId, vintage) {
    await this._delay();
    const segments = MOCK_DATA.segmentMetrics[modelId];
    if (!segments) {
      throw new Error('No segment data available for this model');
    }
    return segments;
  },

  // Workflow functions
  ingest: async function(body) {
    await this._delay();
    const datasetId = `DS-${MOCK_DATA.nextDatasetId++}`;
    MOCK_DATA.datasets[datasetId] = {
      dataset_id: datasetId,
      portfolio: body.portfolio,
      model_type: body.model_type,
      model_id: body.model_id,
      vintage: body.vintage,
      row_count: body.data ? body.data.length : 0,
      qc_status: 'pending',
      has_scores: body.data && body.data.length > 0 && body.data[0].score !== undefined,
      metrics_computed: false
    };
    return {
      status: 'success',
      dataset_id: datasetId,
      message: `Ingested ${body.data ? body.data.length : 0} rows`
    };
  },

  getDataset: async function(datasetId) {
    await this._delay();
    const dataset = MOCK_DATA.datasets[datasetId];
    if (!dataset) {
      throw new Error('Dataset not found');
    }
    return dataset;
  },

  runQc: async function(datasetId) {
    await this._delay(800);
    const dataset = MOCK_DATA.datasets[datasetId];
    if (!dataset) {
      throw new Error('Dataset not found');
    }
    dataset.qc_status = 'passed';
    return {
      status: 'passed',
      message: 'QC passed: All required columns present, no nulls detected'
    };
  },

  scoreDataset: async function(datasetId) {
    await this._delay(1000);
    const dataset = MOCK_DATA.datasets[datasetId];
    if (!dataset) {
      throw new Error('Dataset not found');
    }
    dataset.has_scores = true;
    return {
      status: 'success',
      message: 'Scoring completed for all records'
    };
  },

  computeMetrics: async function(datasetId, modelType) {
    await this._delay(1200);
    const dataset = MOCK_DATA.datasets[datasetId];
    if (!dataset) {
      throw new Error('Dataset not found');
    }
    dataset.metrics_computed = true;
    return {
      status: 'success',
      message: `Metrics computed successfully for ${modelType} model`,
      metrics: {
        KS: 0.4523,
        PSI: 0.0234,
        AUC: 0.8245,
        Gini: 0.6490
      }
    };
  },

  chat: async function(message) {
    await this._delay(500);
    const msg = message.toLowerCase();
    
    // Specific question patterns
    if (msg.includes('attention') || msg.includes('need') && msg.includes('monitor')) {
      return '**Models requiring attention:**\n\n**ACQ-ML-003** - PSI = 0.052 (approaching 0.1 threshold). Distribution drift detected, requires investigation.\n\n**ECM-LIMIT-001** - PSI = 0.031 (moderate). Performance slightly below peers with KS = 0.388.\n\n**Action items:**\n• Review ACQ-ML-003 input variable distributions\n• Consider model recalibration if PSI exceeds 0.1\n• Monitor ECM model for further degradation';
    }
    
    if (msg.includes('rag') || msg.includes('red') && msg.includes('amber') || msg.includes('status') && msg.includes('mean')) {
      return '**RAG Status Indicators:**\n\n🟢 **Green** - Model performing well\n• KS > 0.4 AND PSI < 0.1\n• Strong discrimination, stable population\n\n🟡 **Amber** - Warning, needs monitoring\n• KS 0.3-0.4 OR PSI 0.1-0.25\n• Moderate performance or distribution shift\n\n🔴 **Red** - Action required\n• KS < 0.3 OR PSI > 0.25\n• Poor discrimination or significant drift\n\nIn demo data: Most models are Green, ECM-LIMIT-001 is Amber';
    }
    
    if (msg.includes('compare') && msg.includes('portfolio')) {
      return '**Portfolio Comparison:**\n\n**Acquisition** (3 models)\n• Best performer: ACQ-RET-002 (ML) - KS: 0.523, AUC: 0.876\n• Stable: ACQ-RET-001 (Scorecard) - KS: 0.452, PSI: 0.023\n• Watch: ACQ-ML-003 - PSI elevated at 0.052\n\n**ECM** (1 model)\n• ECM-LIMIT-001 - KS: 0.388, needs improvement\n\n**Collections** (1 model)\n• COL-RISK-001 - KS: 0.412, recovery rate: 62%\n\n**Fraud** (1 model)\n• FRD-TXN-001 - Excellent: KS: 0.623, 89% detection rate\n\n**Winner:** Fraud portfolio leads in performance';
    }
    
    if ((msg.includes('explain') || msg.includes('what')) && msg.includes('ks') && msg.includes('psi')) {
      return '**KS (Kolmogorov-Smirnov):**\nMeasures model discrimination - how well it separates good vs bad customers.\n• Range: 0 to 1\n• Target: > 0.4 (good), > 0.5 (excellent)\n• Calculation: Max difference between cumulative distributions\n• Use: Assess predictive power\n\n**PSI (Population Stability Index):**\nMeasures distribution drift - how much the scored population has changed.\n• Range: 0 to infinity (typically < 0.5)\n• Thresholds: < 0.1 stable, 0.1-0.25 monitor, > 0.25 action\n• Calculation: Sum of (actual% - expected%) × ln(actual%/expected%)\n• Use: Detect population shifts\n\n**Together:** KS shows if model works, PSI shows if population changed. Both stable = healthy model!';
    }
    
    // Simple pattern matching for demo chatbot
    if (msg.includes('ks') && !msg.includes('psi')) {
      return 'KS (Kolmogorov-Smirnov) statistic measures the maximum difference between cumulative distributions of good and bad customers. Values above 0.4 indicate good discrimination. In our demo data, most models show KS between 0.38-0.62.';
    }
    if (msg.includes('psi') && !msg.includes('ks')) {
      return 'PSI (Population Stability Index) measures distribution drift. PSI < 0.1 is stable, 0.1-0.25 needs monitoring, >0.25 requires action. Demo models show PSI ranging from 0.018 to 0.052, indicating stable populations.';
    }
    if (msg.includes('auc') || msg.includes('roc')) {
      return 'AUC (Area Under ROC Curve) ranges from 0.5 (random) to 1.0 (perfect). Values above 0.7 are acceptable, above 0.8 are good. Our demo fraud model achieves 0.91 AUC, showing excellent performance.';
    }
    if (msg.includes('gini')) {
      return 'Gini coefficient measures inequality in model predictions. Gini = 2×AUC - 1, ranging from 0 to 1. Values above 0.6 are good. It represents the area between the Lorenz curve and diagonal, indicating model lift.';
    }
    if ((msg.includes('model') || msg.includes('which')) && msg.includes('perform')) {
      return 'Based on demo data: **ACQ-RET-002** (ML) shows the best overall performance with KS=0.523 and AUC=0.876. **FRD-TXN-001** (Fraud) excels with KS=0.623 and 89% fraud detection rate. All models maintain stable PSI values.';
    }
    if (msg.includes('best') || msg.includes('top')) {
      return '**Top 3 Models:**\n1. **FRD-TXN-001** (Fraud) - KS: 0.623, AUC: 0.912, 89% detection rate\n2. **ACQ-RET-002** (ML) - KS: 0.523, AUC: 0.876, excellent all-round\n3. **ACQ-ML-003** (ML) - KS: 0.499, AUC: 0.857 (watch PSI)\n\nAll three show strong discrimination with KS > 0.49';
    }
    if (msg.includes('worst') || msg.includes('poor')) {
      return '**Models needing improvement:**\n• **ECM-LIMIT-001** - KS: 0.388 (below 0.4 threshold)\n• Moderate discrimination, consider enhancement\n• PSI: 0.031 (acceptable)\n\nNot necessarily "bad", but has room for optimization compared to other models in the portfolio.';
    }
    if (msg.includes('trend')) {
      return 'Demo trend analysis shows stable KS performance across vintages for most models. PSI has slightly increased for ACQ-ML-003, suggesting potential distribution drift that requires monitoring.';
    }
    if (msg.includes('segment')) {
      return 'Segment analysis reveals that thick_file segments consistently outperform thin_file segments. For ACQ-RET-001, thick_file shows KS=0.492 vs thin_file KS=0.388, highlighting the importance of segment-level monitoring.';
    }
    if (msg.includes('recommendation') || msg.includes('recommend') || msg.includes('action')) {
      return 'Key recommendations from demo data:\n1. Monitor ACQ-ML-003 closely (PSI=0.052, approaching threshold)\n2. Investigate thick_file vs thin_file performance gaps\n3. Leverage fraud model success (FRD-TXN-001) as best practice\n4. Consider ECM-LIMIT-001 enhancements to improve KS\n5. Maintain current strategies for stable models';
    }
    if (msg.includes('fraud')) {
      return '**Fraud Model (FRD-TXN-001):**\n• KS: 0.623 (excellent)\n• AUC: 0.912 (outstanding)\n• Fraud detection rate: 89.45%\n• False positive rate: 2.34% (very low)\n• PSI: 0.019 (very stable)\n\nThis is the best performing model in the portfolio. Top decile captures 20% fraud rate vs 0.08% in bottom decile.';
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('help')) {
      return 'Hello! I am your Model Monitoring assistant. I can help you understand:\n• **Metrics**: Ask about KS, PSI, AUC, Gini\n• **Models**: Which models need attention?\n• **RAG Status**: What do the color indicators mean?\n• **Portfolios**: Compare portfolio performance\n• **Trends**: Analyze performance over time\n\nWhat would you like to know?';
    }
    
    // Default response
    return 'I understand you are asking about "' + message + '". In demo mode, I can discuss:\n• KS, PSI, AUC metrics\n• Model performance comparisons\n• RAG status meanings\n• Portfolio analysis\n• Models needing attention\n\nTry: "Which models need attention?" or "Compare portfolios"';
  },

  _delay: function(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.MOCK_DATA = MOCK_DATA;
  console.log('Mock data module loaded');
}

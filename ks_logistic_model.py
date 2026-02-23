"""
Kolmogorov-Smirnov (KS) Statistic for Logistic Regression Model

The KS statistic measures the maximum difference between the cumulative distribution
functions of the positive and negative classes. It's commonly used in credit risk
modeling and binary classification to assess model discrimination ability.

KS ranges from 0 to 1, where:
- Higher KS indicates better model discrimination
- KS > 0.3 is generally considered good
- KS > 0.4 is considered very good
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_curve
import warnings
warnings.filterwarnings('ignore')


def calculate_ks(y_true, y_pred_proba):
    """
    Calculate Kolmogorov-Smirnov statistic for binary classification.
    
    Parameters:
    -----------
    y_true : array-like
        True binary labels (0 or 1)
    y_pred_proba : array-like
        Predicted probabilities for the positive class (class 1)
    
    Returns:
    --------
    ks_statistic : float
        KS statistic value (maximum difference between cumulative distributions)
    ks_threshold : float
        Probability threshold at which KS statistic is achieved
    """
    # Convert to numpy arrays
    y_true = np.array(y_true)
    y_pred_proba = np.array(y_pred_proba)
    
    # Sort by predicted probability (descending)
    sorted_indices = np.argsort(y_pred_proba)[::-1]
    y_true_sorted = y_true[sorted_indices]
    y_pred_proba_sorted = y_pred_proba[sorted_indices]
    
    # Calculate cumulative distributions
    n_total = len(y_true)
    n_positive = np.sum(y_true == 1)
    n_negative = n_total - n_positive
    
    # Cumulative counts
    cum_positive = np.cumsum(y_true_sorted == 1) / n_positive if n_positive > 0 else np.zeros(n_total)
    cum_negative = np.cumsum(y_true_sorted == 0) / n_negative if n_negative > 0 else np.zeros(n_total)
    
    # Calculate KS statistic
    ks_values = np.abs(cum_positive - cum_negative)
    ks_statistic = np.max(ks_values)
    ks_index = np.argmax(ks_values)
    ks_threshold = y_pred_proba_sorted[ks_index]
    
    return ks_statistic, ks_threshold, cum_positive, cum_negative, y_pred_proba_sorted


def plot_ks_curve(y_true, y_pred_proba, ks_statistic, ks_threshold, 
                  cum_positive, cum_negative, y_pred_proba_sorted):
    """
    Plot KS curve showing cumulative distributions and KS statistic.
    
    Parameters:
    -----------
    y_true : array-like
        True binary labels
    y_pred_proba : array-like
        Predicted probabilities
    ks_statistic : float
        KS statistic value
    ks_threshold : float
        Threshold at which KS is achieved
    cum_positive : array
        Cumulative distribution of positive class
    cum_negative : array
        Cumulative distribution of negative class
    y_pred_proba_sorted : array
        Sorted predicted probabilities
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Create percentile-based x-axis
    percentiles = np.arange(0, 101, 1)
    
    # Plot cumulative distributions
    ax.plot(percentiles, cum_positive * 100, label='Cumulative % of Positive Class', 
            linewidth=2, color='blue')
    ax.plot(percentiles, cum_negative * 100, label='Cumulative % of Negative Class', 
            linewidth=2, color='red')
    
    # Mark KS statistic point
    ks_percentile = (np.argmax(np.abs(cum_positive - cum_negative)) / len(cum_positive)) * 100
    ax.axvline(x=ks_percentile, color='green', linestyle='--', linewidth=2, 
               label=f'KS Statistic = {ks_statistic:.4f} at {ks_threshold:.4f}')
    
    # Fill area between curves
    ax.fill_between(percentiles, cum_positive * 100, cum_negative * 100, 
                    alpha=0.3, color='gray', label='KS Area')
    
    ax.set_xlabel('Percentile of Population (sorted by predicted probability)', fontsize=12)
    ax.set_ylabel('Cumulative Percentage (%)', fontsize=12)
    ax.set_title(f'Kolmogorov-Smirnov (KS) Curve\nKS Statistic = {ks_statistic:.4f}', 
                fontsize=14, fontweight='bold')
    ax.legend(loc='best', fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_xlim([0, 100])
    ax.set_ylim([0, 100])
    
    plt.tight_layout()
    return fig


def ks_statistic_logistic_model(X, y, test_size=0.3, random_state=42):
    """
    Train a logistic regression model and calculate KS statistic.
    
    Parameters:
    -----------
    X : array-like or DataFrame
        Feature matrix
    y : array-like
        Target variable (binary: 0 or 1)
    test_size : float
        Proportion of data to use for testing
    random_state : int
        Random seed for reproducibility
    
    Returns:
    --------
    results : dict
        Dictionary containing model, KS statistic, threshold, and other metrics
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    # Train logistic regression model
    model = LogisticRegression(random_state=random_state, max_iter=1000)
    model.fit(X_train, y_train)
    
    # Get predicted probabilities
    y_pred_proba_train = model.predict_proba(X_train)[:, 1]
    y_pred_proba_test = model.predict_proba(X_test)[:, 1]
    
    # Calculate KS for training set
    ks_train, threshold_train, cum_pos_train, cum_neg_train, proba_sorted_train = \
        calculate_ks(y_train, y_pred_proba_train)
    
    # Calculate KS for test set
    ks_test, threshold_test, cum_pos_test, cum_neg_test, proba_sorted_test = \
        calculate_ks(y_test, y_pred_proba_test)
    
    results = {
        'model': model,
        'ks_train': ks_train,
        'ks_test': ks_test,
        'threshold_train': threshold_train,
        'threshold_test': threshold_test,
        'y_test': y_test,
        'y_pred_proba_test': y_pred_proba_test,
        'cum_positive_test': cum_pos_test,
        'cum_negative_test': cum_neg_test,
        'y_pred_proba_sorted_test': proba_sorted_test,
        'X_test': X_test,
        'y_train': y_train,
        'y_pred_proba_train': y_pred_proba_train
    }
    
    return results


# Example usage
if __name__ == "__main__":
    # Generate sample data for demonstration
    print("Generating sample data...")
    np.random.seed(42)
    n_samples = 1000
    
    # Create synthetic features
    X = np.random.randn(n_samples, 5)
    
    # Create target variable with some relationship to features
    # Higher values of first feature increase probability of class 1
    log_odds = -2 + 1.5 * X[:, 0] + 0.8 * X[:, 1] - 0.5 * X[:, 2]
    prob = 1 / (1 + np.exp(-log_odds))
    y = np.random.binomial(1, prob, n_samples)
    
    # Convert to DataFrame for better display
    X_df = pd.DataFrame(X, columns=[f'Feature_{i+1}' for i in range(5)])
    y_series = pd.Series(y, name='Target')
    
    print(f"Dataset shape: {X_df.shape}")
    print(f"Target distribution:\n{y_series.value_counts()}\n")
    
    # Calculate KS statistic
    print("Training logistic regression model and calculating KS statistic...")
    results = ks_statistic_logistic_model(X_df, y_series)
    
    # Print results
    print("\n" + "="*60)
    print("KS STATISTIC RESULTS")
    print("="*60)
    print(f"KS Statistic (Training): {results['ks_train']:.4f}")
    print(f"KS Statistic (Test):     {results['ks_test']:.4f}")
    print(f"\nKS Threshold (Training): {results['threshold_train']:.4f}")
    print(f"KS Threshold (Test):     {results['threshold_test']:.4f}")
    
    # Interpret KS value
    print("\n" + "-"*60)
    print("KS INTERPRETATION:")
    print("-"*60)
    ks_value = results['ks_test']
    if ks_value < 0.2:
        interpretation = "Poor discrimination"
    elif ks_value < 0.3:
        interpretation = "Fair discrimination"
    elif ks_value < 0.4:
        interpretation = "Good discrimination"
    else:
        interpretation = "Very good discrimination"
    
    print(f"KS = {ks_value:.4f} indicates: {interpretation}")
    print("\nKS Interpretation Guide:")
    print("  KS < 0.2  : Poor discrimination")
    print("  0.2 ≤ KS < 0.3 : Fair discrimination")
    print("  0.3 ≤ KS < 0.4 : Good discrimination")
    print("  KS ≥ 0.4  : Very good discrimination")
    
    # Plot KS curve
    print("\nGenerating KS curve plot...")
    fig = plot_ks_curve(
        results['y_test'],
        results['y_pred_proba_test'],
        results['ks_test'],
        results['threshold_test'],
        results['cum_positive_test'],
        results['cum_negative_test'],
        results['y_pred_proba_sorted_test']
    )
    
    plt.savefig('ks_curve.png', dpi=300, bbox_inches='tight')
    print("KS curve saved as 'ks_curve.png'")
    plt.show()
    
    print("\n" + "="*60)
    print("Code execution completed successfully!")
    print("="*60)

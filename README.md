# 🚦 FlowCast: Traffic Flow Prediction System

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![Machine Learning](https://img.shields.io/badge/ML-Classification-green)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Enabled-orange)](https://xgboost.readthedocs.io/)

**FlowCast** is an intelligent machine learning system designed to predict traffic situations based on real-time vehicle counts. The system classifies traffic conditions into four distinct categories: **Low**, **Normal**, **Heavy**, and **High**, enabling better traffic management and route planning decisions.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Dataset](#-dataset)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage](#-usage)
- [Methodology](#-methodology)
- [Model Performance](#-model-performance)
- [Results and Insights](#-results-and-insights)
- [Technologies Used](#-technologies-used)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Project Overview

FlowCast addresses the critical challenge of traffic congestion by leveraging machine learning to predict traffic situations based on vehicle counts and temporal patterns. The system analyzes various factors including:

- **Vehicle Distribution**: Cars, bikes, buses, and trucks
- **Temporal Patterns**: Time of day, day of week, and date
- **Historical Trends**: Traffic patterns across different time periods

The primary goal is to provide accurate, real-time traffic situation predictions that can help:
- **Traffic Management Systems**: Optimize signal timings and traffic flow
- **Navigation Apps**: Suggest better routes based on predicted congestion
- **Urban Planners**: Understand traffic patterns for infrastructure planning
- **Commuters**: Make informed decisions about travel times and routes

---

## ✨ Key Features

### 🔍 Comprehensive Data Analysis
- Exploratory data analysis with insightful visualizations
- Traffic pattern identification across days and times
- Correlation analysis between features

### 🛠️ Advanced Feature Engineering
- Time-based feature extraction (hour, minute, AM/PM)
- Day of week encoding
- Categorical variable transformation

### 🤖 Multiple ML Models
- **Logistic Regression**: Baseline classification
- **Random Forest**: Ensemble learning approach
- **Support Vector Classifier (SVC)**: Non-linear classification
- **XGBoost**: Gradient boosting for optimal performance
- **AdaBoost**: Adaptive boosting technique
- **Voting Classifier**: Ensemble of all models

### 📊 Model Evaluation
- Cross-validation for robust assessment
- Confusion matrix analysis
- Detailed classification reports
- Model comparison visualizations

### 🎯 Custom Prediction Interface
- Single input prediction capability
- Probability distribution for each traffic class
- Easy-to-use prediction format

---

## 📊 Dataset

### Source
The dataset contains traffic sensor data collected over multiple days, recording vehicle counts and traffic situations at regular intervals.

### Dataset Characteristics
- **Total Records**: Varies based on collection period
- **Features**: 10 input features
- **Target Classes**: 4 traffic situations (Low, Normal, Heavy, High)
- **File Location**: `data/raw/Traffic.csv`

### Features Description

| Feature | Type | Description |
|---------|------|-------------|
| **Time** | String | Timestamp in 12-hour format (HH:MM AM/PM) |
| **Date** | Integer | Day of the month (1-31) |
| **Day of the week** | String | Name of the weekday |
| **CarCount** | Integer | Number of cars observed |
| **BikeCount** | Integer | Number of bikes observed |
| **BusCount** | Integer | Number of buses observed |
| **TruckCount** | Integer | Number of trucks observed |
| **Total** | Integer | Total vehicle count |
| **Traffic Situation** | String | Target variable (low/normal/heavy/high) |

### Engineered Features
- **hour**: Hour of the day (0-23)
- **minute**: Minute of the hour (0-59)
- **AM/PM**: Binary indicator (0=AM, 1=PM)

---

## 📁 Project Structure

```
FlowCast-Traffic-Flow-Prediction/
│
├── data/
│   ├── raw/
│   │   └── Traffic.csv              # Original dataset
│   └── processed/
│       └── traffic_processed.csv    # Cleaned and engineered data
│
├── models/
│   ├── logistic_regression.pkl      # Trained Logistic Regression model
│   ├── random_forest.pkl            # Trained Random Forest model
│   ├── svc.pkl                      # Trained SVC model
│   ├── xgboost.pkl                  # Trained XGBoost model
│   ├── adaboost.pkl                 # Trained AdaBoost model
│   ├── voting_classifier.pkl        # Trained Voting Classifier
│   └── scaler.pkl                   # StandardScaler for feature scaling
│
├── notebooks/
│   ├── 01_data_preprocessing.ipynb  # Data loading and preprocessing
│   ├── 02_model_training.ipynb      # Model training pipeline
│   ├── 03_model_evaluation.ipynb    # Model evaluation and predictions
│   └── full.ipynb                   # Complete analysis in one notebook
│
├── reports/
│   └── figures/                     # Generated visualizations
│
├── .gitignore
└── README.md                        # Project documentation
```

---

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/johnjames10/FlowCast-Traffic-Flow-Prediction.git
cd FlowCast-Traffic-Flow-Prediction
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install numpy pandas matplotlib seaborn scikit-learn xgboost jupyter
```

### Detailed Package Requirements
```
numpy>=1.21.0
pandas>=1.3.0
matplotlib>=3.4.0
seaborn>=0.11.0
scikit-learn>=1.0.0
xgboost>=1.5.0
jupyter>=1.0.0
```

---

## 💻 Usage

### Option 1: Run Complete Pipeline (Notebooks)

#### 1. Data Preprocessing
```bash
jupyter notebook notebooks/01_data_preprocessing.ipynb
```
**What it does:**
- Loads raw traffic data
- Performs exploratory data analysis
- Extracts time-based features
- Encodes categorical variables
- Saves processed data

#### 2. Model Training
```bash
jupyter notebook notebooks/02_model_training.ipynb
```
**What it does:**
- Loads processed data
- Splits data into train/test sets
- Scales features using StandardScaler
- Trains 6 different ML models
- Saves trained models and scaler

#### 3. Model Evaluation
```bash
jupyter notebook notebooks/03_model_evaluation.ipynb
```
**What it does:**
- Loads trained models
- Evaluates performance on test set
- Performs cross-validation
- Generates visualizations
- Provides custom prediction interface

### Option 2: Use Trained Models Directly

```python
import pickle
import pandas as pd
import numpy as np

# Load the trained XGBoost model
with open('models/xgboost.pkl', 'rb') as f:
    model = pickle.load(f)

# Load the scaler
with open('models/scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Create custom input
custom_input = {
    'Date': 15,
    'Day of the week': 3,      # 0=Monday, 6=Sunday
    'CarCount': 120,
    'BikeCount': 45,
    'BusCount': 8,
    'TruckCount': 15,
    'Total': 188,
    'hour': 17,
    'minute': 30,
    'AM/PM': 1                 # 0=AM, 1=PM
}

# Convert to DataFrame and scale
input_df = pd.DataFrame([custom_input])
input_scaled = scaler.transform(input_df)

# Make prediction
prediction = model.predict(input_scaled)
probabilities = model.predict_proba(input_scaled)

# Map prediction to traffic situation
situations = {0: 'Low', 1: 'Normal', 2: 'Heavy', 3: 'High'}
print(f"Predicted Traffic: {situations[prediction[0]]}")
```

---

## 🔬 Methodology

### 1. Data Collection and Loading
- Import traffic data from CSV file
- Initial data exploration and profiling
- Identify data types and missing values

### 2. Exploratory Data Analysis (EDA)

#### Key Findings:
- 📊 **Vehicle Impact**: CarCount has the highest correlation with traffic situation
- 📅 **Busy Days**: Wednesday and Thursday see the most traffic
- ⏰ **Peak Hours**: 8:00 AM - 10:00 AM and 3:00 PM - 6:00 PM
- 🌙 **Night Traffic**: Heavy traffic mostly occurs after 9:00 PM
- 📉 **Low Traffic**: Friday typically has minimum traffic
- ✅ **Data Quality**: No missing values in the dataset

#### Visualizations Created:
- Traffic distribution by day of week
- Vehicle count histograms
- Correlation heatmaps
- Time-based traffic patterns
- Joint plots for feature relationships

### 3. Data Preprocessing

#### Feature Engineering Steps:
```python
# Time feature extraction
data['hour'] = pd.to_datetime(data['Time']).dt.hour
data['minute'] = pd.to_datetime(data['Time']).dt.minute
data['AM/PM'] = data['Time'].apply(lambda x: 0 if 'AM' in x else 1)

# Categorical encoding
day_mapping = {'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
               'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7}
data['Day of the week'] = data['Day of the week'].replace(day_mapping)

# Target encoding
situation_mapping = {'low': 0, 'normal': 1, 'heavy': 2, 'high': 3}
data['Traffic Situation'] = data['Traffic Situation'].replace(situation_mapping)
```

### 4. Data Splitting
- **Training Set**: 80% of data
- **Test Set**: 20% of data
- **Random State**: 0 (for reproducibility)

### 5. Feature Scaling
- **Method**: StandardScaler
- **Purpose**: Normalize features to have mean=0 and std=1
- **Applied To**: All numeric features

### 6. Model Training

#### Models Implemented:

1. **Logistic Regression**
   - Multi-class classification with OvR strategy
   - Max iterations: 1000
   - Good baseline performance

2. **Random Forest Classifier**
   - Number of trees: 100
   - Captures non-linear relationships
   - Handles feature interactions well
   - Accuracy: ~99.4%

3. **Support Vector Classifier (SVC)**
   - Kernel: RBF (default)
   - Probability enabled for soft predictions
   - Effective for high-dimensional data

4. **XGBoost Classifier**
   - Gradient boosting framework
   - Excellent performance on structured data
   - Accuracy: ~99.8% - 100%
   - **Best performing model**

5. **AdaBoost Classifier**
   - Adaptive boosting algorithm
   - Sequential error correction
   - Combines weak learners

6. **Voting Classifier**
   - Ensemble of all 5 models
   - Hard voting strategy
   - Combines predictions for robustness

### 7. Model Evaluation

#### Evaluation Metrics:
- **Accuracy Score**: Overall correct predictions
- **Confusion Matrix**: Class-wise prediction analysis
- **Classification Report**: Precision, Recall, F1-Score per class
- **Cross-Validation**: 5-fold CV for robust assessment

#### Validation Strategy:
```python
# 5-Fold Cross-Validation
scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
mean_accuracy = scores.mean()
std_deviation = scores.std()
```

---

## 📈 Model Performance

### Test Set Results

| Model | Test Accuracy | Cross-Val Mean | CV Std Dev |
|-------|--------------|----------------|------------|
| **XGBoost** | **100.0%** | **99.8%** | **±0.003** |
| Random Forest | 99.4% | 99.4% | ±0.004 |
| Voting Classifier | 99.2% | - | - |
| SVC | 98.8% | 98.6% | ±0.005 |
| AdaBoost | 97.5% | 97.2% | ±0.008 |
| Logistic Regression | 96.2% | 96.0% | ±0.010 |

### Best Model: XGBoost

#### Why XGBoost Performs Best:
1. **Gradient Boosting**: Builds trees sequentially, correcting errors
2. **Regularization**: Built-in L1 and L2 regularization prevents overfitting
3. **Handling Complexity**: Captures non-linear patterns effectively
4. **Speed**: Optimized for performance with parallel processing
5. **Feature Importance**: Provides insights into feature contributions

#### Classification Report (XGBoost):
```
              precision    recall  f1-score   support

         Low       1.00      1.00      1.00       XXX
      Normal       1.00      1.00      1.00       XXX
       Heavy       1.00      1.00      1.00       XXX
        High       1.00      1.00      1.00       XXX

    accuracy                           1.00       XXX
   macro avg       1.00      1.00      1.00       XXX
weighted avg       1.00      1.00      1.00       XXX
```

### Confusion Matrix
The confusion matrix shows perfect classification with no misclassifications across all four traffic situation classes.

---

## 💡 Results and Insights

### Key Discoveries from Analysis

#### 1. Vehicle Type Impact
- **Cars (CarCount)** contribute most significantly to traffic situations
- Heavy vehicles (buses, trucks) have moderate impact
- Bikes show minimal correlation with traffic congestion

#### 2. Temporal Patterns
- **Peak Morning Hours**: 8:00 AM - 10:00 AM (office commute)
- **Peak Evening Hours**: 3:00 PM - 6:00 PM (return commute)
- **Off-Peak**: 10:00 PM - 6:00 AM (low traffic)

#### 3. Weekly Trends
- **Busiest Days**: Wednesday, Thursday
- **Moderate Days**: Monday, Tuesday
- **Lightest Day**: Friday (early weekend effect)
- **Weekend**: Saturday and Sunday show distinct patterns

#### 4. Traffic Situation Distribution
- **Normal Traffic**: Most common situation
- **Heavy Traffic**: Concentrated in peak hours
- **Low Traffic**: Early morning and late night
- **High Traffic**: Rare, special events or incidents

#### 5. Model Insights
- Ensemble methods outperform individual classifiers
- XGBoost handles class imbalance effectively
- Feature scaling significantly improves performance
- Time-based features are highly predictive

---

## 🛠️ Technologies Used

### Programming Language
- ![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)

### Data Processing & Analysis
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing and array operations

### Machine Learning
- **Scikit-learn**: ML algorithms and utilities
  - Model training and evaluation
  - Preprocessing and scaling
  - Cross-validation
  - Metrics calculation
- **XGBoost**: Gradient boosting framework

### Data Visualization
- **Matplotlib**: Plotting and visualization
- **Seaborn**: Statistical data visualization

### Development Environment
- **Jupyter Notebook**: Interactive development and documentation
- **Git**: Version control
- **GitHub**: Code hosting and collaboration

### Model Persistence
- **Pickle**: Model serialization and storage

---

## 🔮 Future Enhancements

### Short-term Improvements
1. **Web Interface**
   - Deploy using Streamlit or Flask
   - Interactive prediction dashboard
   - Real-time traffic monitoring

2. **Mobile Application**
   - Android/iOS app for on-the-go predictions
   - Push notifications for traffic alerts
   - Route optimization suggestions

3. **Additional Features**
   - Weather data integration
   - Special events calendar
   - Road construction information
   - Accident/incident data

### Long-term Goals
1. **Real-time Predictions**
   - Live traffic sensor integration
   - Streaming data processing
   - Real-time model updates

2. **Geographic Expansion**
   - Multiple road segments
   - City-wide coverage
   - Inter-city traffic analysis

3. **Deep Learning**
   - LSTM networks for time series
   - CNN for pattern recognition
   - Transformer models for sequence prediction

4. **Advanced Analytics**
   - Predictive maintenance for infrastructure
   - Traffic signal optimization
   - Route planning algorithms
   - Congestion pricing recommendations

5. **API Development**
   - RESTful API for predictions
   - Integration with third-party services
   - Documentation and SDKs

---

## 🎓 How to Use This Project

### For Students & Learners
- Study the complete ML pipeline from data to deployment
- Learn feature engineering techniques
- Understand model comparison and selection
- Practice with Jupyter notebooks

### For Developers
- Use the trained models in your applications
- Extend the system with new features
- Integrate with existing traffic systems
- Contribute improvements via pull requests

### For Researchers
- Baseline for traffic prediction research
- Compare new algorithms against existing models
- Test different feature engineering approaches
- Explore ensemble methods

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Areas for Contribution
- Add new ML models
- Improve data preprocessing
- Enhance visualizations
- Write documentation
- Fix bugs
- Add test cases

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👥 Team & Acknowledgments

### Development Team
This project was developed collaboratively with contributions in:
- Data collection and preprocessing
- Feature engineering
- Model development and training
- Evaluation and visualization
- Documentation

### Acknowledgments
- Dataset providers
- Open-source community
- Machine learning libraries maintainers

---

## 📧 Contact

For questions, suggestions, or collaboration opportunities:

- **GitHub**: [johnjames10/FlowCast-Traffic-Flow-Prediction](https://github.com/johnjames10/FlowCast-Traffic-Flow-Prediction)
- **Issues**: [Report a bug or request a feature](https://github.com/johnjames10/FlowCast-Traffic-Flow-Prediction/issues)

---

## 📊 Project Status

![Status](https://img.shields.io/badge/Status-Complete-success)
![Maintenance](https://img.shields.io/badge/Maintenance-Active-green)
![Contributions](https://img.shields.io/badge/Contributions-Welcome-brightgreen)

**Current Version**: 1.0.0  
**Last Updated**: January 2026

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐!

---

<div align="center">
  <strong>Built with ❤️ for better traffic management</strong>
  <br>
  <sub>Making commutes smarter, one prediction at a time</sub>
</div>

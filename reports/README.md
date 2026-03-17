# FlowCast: Intelligent Traffic Flow Prediction

FlowCast is a machine learning-based traffic prediction system designed to forecast future traffic speed on road segments using historical traffic data. The project focuses on analyzing traffic patterns and predicting congestion by leveraging time-based features and lagged traffic information.

---
## 🚦 Project Objective
The main objective of this project is to predict future traffic speed for a given road segment using historical traffic conditions. Accurate traffic speed prediction helps in identifying congestion patterns and supports intelligent traffic management and route planning.

---
## 📊 Dataset
The dataset used in this project is obtained from Kaggle and contains time-series traffic sensor data. It includes information such as traffic speed, traffic volume, lane occupancy, and timestamps.

### Key Features Used:
- segment_id
- timestamp
- traffic_speed
- traffic_volume
- lane_occupancy
- hour
- day_of_week
- is_weekend
- target_speed (future traffic speed)

---
## ⚙️ Methodology

### 1. Data Collection
Traffic data is collected from a publicly available Kaggle dataset.

### 2. Data Preprocessing
- Timestamp conversion and sorting
- Handling missing values
- Feature extraction from timestamp
- Creation of target variable
- Time-based train-test split

### 3. Feature Engineering
- Time features (hour, day of week, weekend)
- Lag features (previous traffic speeds)
- Target variable generation

### 4. Model Implementation
The following models are used:
- Linear Regression (baseline)
- Ridge Regression (improved linear model)
- XGBoost Regressor (main model)

### 5. Model Evaluation
Models are evaluated using:
- Mean Absolute Error (MAE)
- Root Mean Square Error (RMSE)

---
## 🤖 Machine Learning Model
XGBoost is used as the primary prediction model due to its ability to handle non-linear relationships and structured traffic data efficiently. Lag features are incorporated to capture temporal dependencies.

---
## 📈 Results
The XGBoost model demonstrates improved performance over baseline linear models by accurately predicting future traffic speed and capturing congestion trends.

---
## 🛠️ Technologies Used
- Python
- Pandas
- NumPy
- Scikit-learn
- XGBoost
- Matplotlib / Seaborn
- Jupyter Notebook

---
## 👥 Team Contribution
This project was developed by a team of four members, with tasks divided across data collection, preprocessing, feature engineering, model development, and evaluation.

---
## 🚀 Future Work
- Deploy the model using a web interface (Streamlit or Flask)

---

## 📌 Conclusion
FlowCast demonstrates how machine learning techniques can be effectively applied to real-world traffic prediction problems. The project highlights the importance of data preprocessing, feature engineering, and model selection in building reliable predictive systems.

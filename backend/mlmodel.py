import pandas as pd
import mysql.connector
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
from datetime import datetime
import numpy as np
import joblib

# 데이터베이스 연결 설정
db_config = {
    "host": "localhost",  # 데이터베이스 주소
    "user": "sunha",   # 사용자 이름
    "password": "1234",   # 비밀번호
    "database": "backend" # 데이터베이스 이름
}

def load_data_from_db():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = "SELECT date, SO2, NO2, O3, CO, PM10, PM25 FROM air_quality"
        cursor.execute(query)
        data = cursor.fetchall()
        df = pd.DataFrame(data)
        cursor.close()
        conn.close()
        return df
    except mysql.connector.Error as e:
        print(f"Database connection error: {e}")
        return None

# 데이터베이스에 예측값 저장
def save_predictions_to_db(predictions, dates):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        for date, predicted_pm25 in zip(dates, predictions):
            query = """
                UPDATE air_quality
                SET predicted_pm25 = %s
                WHERE date = %s
            """
            cursor.execute(query, (predicted_pm25, date))
        conn.commit()
        cursor.close()
        conn.close()
        print("Predictions saved successfully to the database.")
    except mysql.connector.Error as e:
        print(f"Error saving predictions: {e}")

# 데이터 로드
df = load_data_from_db()
if df is None:
    print("Failed to load data from database.")
else:
    print("Data loaded successfully from database.")

# NaN 값 확인
print("NaN 값 개수:\n", df.isnull().sum())

# NaN 값 처리
df = df.dropna()  # NaN 값이 있는 행을 제거

# 날짜를 숫자로 변환하여 추가 (연속 변수로 사용하기 위해)
df['date_numeric'] = df['date'].apply(lambda x: (x - datetime(2024, 1, 1).date()).days)

# 입력 변수(X)와 목표 변수(y) 설정
X = df[['date_numeric', 'SO2', 'NO2', 'O3', 'CO', 'PM10']]
y = df['PM25']

# 데이터 정규화
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()

X_scaled = scaler_X.fit_transform(X)
y_scaled = scaler_y.fit_transform(y.values.reshape(-1, 1))

# 시계열 데이터로 변환
def create_sequences(data, target, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(target[i + seq_length])
    return np.array(X), np.array(y)

seq_length = 5  # 시계열 길이
X_seq, y_seq = create_sequences(X_scaled, y_scaled, seq_length)

# 데이터 분할 (훈련 세트와 테스트 세트)
X_train, X_test, y_train, y_test = train_test_split(X_seq, y_seq, test_size=0.2, random_state=42)

# LSTM 모델 정의
model = Sequential([
    LSTM(50, activation='relu', input_shape=(seq_length, X_seq.shape[2]), return_sequences=False),
    Dense(25, activation='relu'),
    Dense(1)  # 출력: PM-2.5 예측
])

# 모델 컴파일
model.compile(optimizer='adam', loss='mean_squared_error')

# 모델 학습
model.fit(X_train, y_train, epochs=100, batch_size=4, verbose=1, validation_data=(X_test, y_test))

# 모델 평가
loss = model.evaluate(X_test, y_test)
print(f"테스트 손실 (MSE): {loss}")

# 모델 저장
model.save("./lstm_pm25_model.h5")
print("모델이 'lstm_pm25_model.h5' 파일로 저장되었습니다.")

# 스케일러 저장
joblib.dump(scaler_X, "./scaler_X.pkl")  # 입력 변수 스케일러 저장
joblib.dump(scaler_y, "./scaler_y.pkl")  # 출력 변수 스케일러 저장

print("Scaler objects saved successfully!")


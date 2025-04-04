from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import mysql.connector
import joblib
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
import joblib
from flask import make_response

# Flask 앱 생성 및 CORS 설정
app = Flask(__name__)
CORS(app)

# 임시 저장소
predictions_cache = {}

# 데이터베이스 연결 설정
def get_db_connection():
    try:
        return mysql.connector.connect(
            host='localhost',
            user='sunha',
            password='1234',
            database='backend'
        )
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        raise

# 데이터 로드 및 예측
def load_and_predict():
    global predictions_cache
    try:
        # 데이터베이스에서 데이터 로드
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT date, SO2, NO2, O3, CO, PM10, PM25 FROM air_quality")
        data = cursor.fetchall()
        conn.close()

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df['date_numeric'] = df['date'].apply(lambda x: (x - datetime(2024, 1, 1)).days)

        # 입력 변수와 목표 변수
        X = df[['date_numeric', 'SO2', 'NO2', 'O3', 'CO', 'PM10']]
        y = df['PM25']

        # 학습된 모델 및 스케일러 로드
        model = load_model("lstm_pm25_model.h5")
        scaler_X = joblib.load("scaler_X.pkl")
        scaler_y = joblib.load("scaler_y.pkl")


        # 데이터 정규화
        X_scaled = scaler_X.transform(X)

        # 시계열 데이터 생성
        seq_length = 5
        X_seq = [X_scaled[i:i + seq_length] for i in range(len(X_scaled) - seq_length)]
        X_seq = np.array(X_seq)

        # 예측 수행
        predictions_scaled = model.predict(X_seq)
        predictions = scaler_y.inverse_transform(predictions_scaled).flatten()

        # 예측값과 날짜 매핑
        dates = df['date'].iloc[seq_length:].tolist()
        predictions_cache = {date.strftime('%Y-%m-%d'): pred for date, pred in zip(dates, predictions)}
    except Exception as e:
        print(f"Error during prediction: {e}")
        predictions_cache = {}


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# API: 데이터와 예측값 반환
@app.route('/all_data', methods=['GET'])
def get_all_data():
    try:
        if not predictions_cache:  # 캐시가 비어있으면 로드 및 예측
            load_and_predict()

        # 데이터베이스에서 실제값 로드
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT date, PM25 FROM air_quality ORDER BY date")
        rows = cursor.fetchall()

        # 최소 날짜와 최대 날짜 가져오기
        cursor.execute("SELECT MIN(date) AS min_date, MAX(date) AS max_date FROM air_quality")
        date_range = cursor.fetchone()
        conn.close()

        # 날짜 형식 변환 및 예측값 추가
        for row in rows:
            row['date'] = row['date'].strftime('%Y-%m-%d')
            # 예측값을 float 형식으로 변환하여 추가
            predicted_value = predictions_cache.get(row['date'], None)
            row['predicted_pm25'] = float(predicted_value) if predicted_value is not None else None

        return jsonify({
            'data': rows,
            'date_range': {
                'min_date': date_range['min_date'].strftime('%Y-%m-%d') if date_range['min_date'] else None,
                'max_date': date_range['max_date'].strftime('%Y-%m-%d') if date_range['max_date'] else None,
            }
        }), 200
    except Exception as e:
        print(f"Error in /all_data API: {e}")
        return jsonify({'error': str(e)}), 500
    
# PM2.5 예측 API
@app.route('/predict_next_days', methods=['GET'])
def predict_next_days():
    try:
        # 학습된 모델 및 스케일러 로드
        model = load_model("lstm_pm25_model.h5")
        scaler_X = joblib.load("scaler_X.pkl")
        scaler_y = joblib.load("scaler_y.pkl")

        # 데이터베이스에서 최근 데이터 로드
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT date, SO2, NO2, O3, CO, PM10, PM25 FROM air_quality ORDER BY date DESC LIMIT 5")
        rows = cursor.fetchall()
        conn.close()

        # 데이터 프레임 생성
        df = pd.DataFrame(rows)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')  # 날짜 정렬

        # 최근 데이터를 기반으로 X 구성
        df['date_numeric'] = df['date'].apply(lambda x: (x - datetime(2024, 1, 1)).days)
        X = df[['date_numeric', 'SO2', 'NO2', 'O3', 'CO', 'PM10']]
        X_scaled = scaler_X.transform(X)

        # 시계열 데이터 구성
        seq_length = 5
        X_seq = [X_scaled[-seq_length:]]  # 가장 최근 5일 데이터를 사용
        X_seq = np.array(X_seq)

        # 향후 3일 예측
        predictions = []
        current_date = df['date'].iloc[-1]
        for i in range(3):
            predicted_scaled = model.predict(X_seq)
            predicted = scaler_y.inverse_transform(predicted_scaled).flatten()[0]
            predictions.append({'date': (current_date + timedelta(days=i + 1)).strftime('%Y-%m-%d'),
                                'predicted_pm25': float(predicted)})

            # 다음 입력값 업데이트
            next_input = np.append(X_seq[0][1:], [[X_scaled[-1][0], 0, 0, 0, 0, predicted_scaled[0][0]]], axis=0)
            X_seq = np.array([next_input])

        return jsonify({'predictions': predictions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# 로그인 API
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # 간단한 사용자 인증 로직
    if username == 'admin' and password == '1234':  # 예제 사용자 이름과 비밀번호
        return jsonify({'token': 'example.jwt.token'}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
    
# 데이터 저장 API
@app.route('/save_data', methods=['POST'])
def save_data():
    data = request.json
    
    # 데이터 유효성 검사
    required_fields = ['date', 'SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM25']
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({'error': f'Missing or invalid field: {field}'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
        INSERT INTO air_quality (date, SO2, NO2, O3, CO, PM10, PM25)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (data['date'], data['SO2'], data['NO2'], data['O3'], data['CO'], data['PM10'], data['PM25']))
        conn.commit()
        return jsonify({'message': '저장완료'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/update_data', methods=['PUT'])
def update_data():
    data = request.json

    # 데이터 유효성 검사
    required_fields = ['date', 'SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM25']
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({'error': f'Missing or invalid field: {field}'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 데이터 존재 여부 확인
        check_sql = "SELECT COUNT(*) FROM air_quality WHERE date = %s"
        cursor.execute(check_sql, (data['date'],))
        exists = cursor.fetchone()[0]

        if not exists:
            return jsonify({'error': f"No data found for date: {data['date']}"}), 404

        # 데이터 수정
        sql = """
        UPDATE air_quality
        SET SO2 = %s, NO2 = %s, O3 = %s, CO = %s, PM10 = %s, PM25 = %s
        WHERE date = %s
        """
        cursor.execute(sql, (data['SO2'], data['NO2'], data['O3'], data['CO'], data['PM10'], data['PM25'], data['date']))
        conn.commit()

        return jsonify({'message': '수정완료'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 데이터 삭제 API
@app.route('/delete_data', methods=['DELETE'])
def delete_data():
    data = request.json

    if 'date' not in data or not data['date']:
        return jsonify({'error': '날짜를 입력하세요'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "DELETE FROM air_quality WHERE date = %s"
        cursor.execute(sql, (data['date'],))
        conn.commit()
        return jsonify({'message': '삭제 완료'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        
# 엑셀로 INSERT API
@app.route('/insert_excel', methods=['POST'])
def upload_excel():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        # 엑셀 파일 읽기
        data = pd.read_excel(file)

        # 날짜 변환
        if 'date' in data.columns:
            data['date'] = pd.to_datetime(data['date']).dt.strftime('%Y-%m-%d')  # MySQL DATE 형식으로 변환

        # 데이터 유효성 검사
        required_columns = ['date', 'SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM25']
        if not all(column in data.columns for column in required_columns):
            return jsonify({'error': 'Invalid file format. Required columns are missing'}), 400

        # 데이터베이스 연결
        conn = get_db_connection()
        cursor = conn.cursor()

        for _, row in data.iterrows():
            sql = """
            INSERT INTO air_quality (date, SO2, NO2, O3, CO, PM10, PM25)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, tuple(row))

        conn.commit()
        return jsonify({'message': '파일 업로드 성공!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 엑셀로 UPDATE API
@app.route('/update_excel', methods=['POST'])
def update_excel():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        # 엑셀 파일 읽기
        data = pd.read_excel(file)

        # 날짜 변환
        if 'date' in data.columns:
            data['date'] = pd.to_datetime(data['date']).dt.strftime('%Y-%m-%d')

        # 데이터 유효성 검사
        required_columns = ['date', 'SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM25']
        if not all(column in data.columns for column in required_columns):
            return jsonify({'error': 'Invalid file format. Required columns are missing'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # UPDATE air_quality
        for _, row in data.iterrows():
            sql = """
            UPDATE air_quality
            SET SO2 = %s, NO2 = %s, O3 = %s, CO = %s, PM10 = %s, PM25 = %s
            WHERE date = %s
            """
            cursor.execute(sql, (row['SO2'], row['NO2'], row['O3'], row['CO'], row['PM10'], row['PM25'], row['date']))

        conn.commit()
        return jsonify({'message': '데이터 업데이트 성공!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 엑셀로 DELETE API
@app.route('/delete_excel', methods=['POST'])
def delete_excel():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        # 엑셀 파일 읽기
        data = pd.read_excel(file)

        # 날짜 변환
        if 'date' in data.columns:
            data['date'] = pd.to_datetime(data['date']).dt.strftime('%Y-%m-%d')

        # 데이터 유효성 검사
        if 'date' not in data.columns:
            return jsonify({'error': 'Invalid file format. Date column is missing'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # DELETE FROM air_quality
        for _, row in data.iterrows():
            sql = "DELETE FROM air_quality WHERE date = %s"
            cursor.execute(sql, (row['date'],))

        conn.commit()
        return jsonify({'message': '데이터 삭제 성공!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/air_quality', methods=['GET'])
def get_air_quality():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT date, SO2, NO2, O3, CO, PM10, PM25 FROM air_quality")
        rows = cursor.fetchall()

        # 날짜 형식을 ISO 8601로 변환
        for row in rows:
            row['date'] = row['date'].strftime('%Y-%m-%d')  # '2014-01-01' 형식으로 변환

        conn.close()
        return jsonify({'data': rows})  # JSON 형태로 반환
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# Fine-tuning 수행 함수
def fine_tune_model(new_data, model_path, scaler_X_path, scaler_y_path, seq_length=5, epochs=50, learning_rate=1e-5):
    try:
        # MinMaxScaler 로드
        scaler_X = joblib.load(scaler_X_path)
        scaler_y = joblib.load(scaler_y_path)
        model = load_model(model_path)

        # 데이터 전처리
        new_data['date_numeric'] = new_data['date'].apply(lambda x: (x - datetime(2024, 1, 1).date()).days)
        X = new_data[['date_numeric', 'SO2', 'NO2', 'O3', 'CO', 'PM10']]
        y = new_data['PM25']

        # 데이터 정규화
        X_scaled = scaler_X.transform(X)
        y_scaled = scaler_y.transform(y.values.reshape(-1, 1))

        # 시계열 데이터로 변환
        X_seq, y_seq = [], []
        for i in range(len(X_scaled) - seq_length):
            X_seq.append(X_scaled[i:i + seq_length])
            y_seq.append(y_scaled[i + seq_length])

        X_seq, y_seq = np.array(X_seq), np.array(y_seq)

        # Fine-tuning
        model.compile(optimizer=Adam(learning_rate=learning_rate), loss='mean_squared_error')
        model.fit(X_seq, y_seq, epochs=epochs, batch_size=4, verbose=1)

        # 모델 저장
        model.save(model_path)
        # 스케일러 저장
        joblib.dump(scaler_X, scaler_X_path)  # 입력 변수 스케일러 저장
        joblib.dump(scaler_y, scaler_y_path)  # 출력 변수 스케일러 저장

        return "Fine-tuning completed successfully"
    except Exception as e:
        return str(e)

# Fine-tuning API
@app.route('/fine_tune', methods=['POST'])
def fine_tune():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        # 엑셀 파일 로드
        data = pd.read_excel(file)
        data['date'] = pd.to_datetime(data['date']).dt.date  # 날짜 변환

        # Fine-tuning 수행
        model_path = "./lstm_pm25_model.h5"
        scaler_X_path = "./scaler_X.pkl"
        scaler_y_path = "./scaler_y.pkl"
        message = fine_tune_model(data, model_path, scaler_X_path, scaler_y_path)

        return jsonify({'message': message}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Flask 앱 실행
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)



import React, { useState } from 'react';
import axios from 'axios';

function DataInputForm() {
    const [formData, setFormData] = useState({
        date: '',
        SO2: '',
        NO2: '',
        O3: '',
        CO: '',
        PM10: '',
        PM25: ''
    });
    const [action, setAction] = useState('insert'); // 작업 선택 상태
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }));
    };

    const handleAction = async () => {
        setIsLoading(true);
        let url = '';
        let method = '';
    
        if (action === 'insert') {
            url = 'http://34.64.136.227:5000/save_data';
            method = 'post';
        } else if (action === 'update') {
            url = 'http://34.64.136.227:5000/update_data';
            method = 'put';
        } else if (action === 'delete') {
            url = 'http://34.64.136.227:5000/delete_data';
            method = 'delete';
        }
    
        console.log('Sending request:', {
            url,
            method,
            data: action === 'delete' ? { date: formData.date } : formData,
        }); // 요청 데이터 출력
    
        try {
            const response = await axios({
                url,
                method,
                data: action === 'delete' ? { date: formData.date } : formData,
            });
            console.log('Response received:', response.data); // 응답 데이터 출력
            setSuccessMessage(response.data.message);
            setFormData({
                date: '',
                SO2: '',
                NO2: '',
                O3: '',
                CO: '',
                PM10: '',
                PM25: '',
            });
    
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error during request:', error); // 전체 에러 로그 출력
            alert(error.response?.data?.error || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        outline: 'none',
    };

    const fieldContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '15px',
    };

    const buttonStyle = {
        padding: '10px 20px',
        background: 'linear-gradient(to right, #007BFF, #0056b3)',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
        transition: 'all 0.3s ease',
        marginTop: '20px',
        display: 'block',
        width: '100%',
    };

    return (
        <div>
            <form
                style={{
                    margin: '0 auto',
                    padding: '30px',
                    width: '100%',
                    maxWidth: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    fontFamily: 'Arial, sans-serif',
                }}
            >
                <div style={fieldContainerStyle}>
                    <label htmlFor="action" style={{ color: '#555', fontWeight: 'bold' }}>작업 선택</label>
                    <select
                        id="action"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="insert">삽입</option>
                        <option value="update">수정</option>
                        <option value="delete">삭제</option>
                    </select>
                </div>

                <div style={fieldContainerStyle}>
                    <label htmlFor="date" style={{ color: '#555', fontWeight: 'bold' }}>날짜</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                </div>
                {['SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM25'].map((field) => (
                    <div key={field} style={fieldContainerStyle}>
                        <label htmlFor={field} style={{ color: '#555', fontWeight: 'bold' }}>{field}</label>
                        <input
                            type="number"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            placeholder={`${field} 농도 입력`}
                            required={field !== 'date'}
                            style={inputStyle}
                        />
                    </div>
                ))}
                
                <button
                    type="button"
                    onClick={handleAction}
                    style={buttonStyle}
                    disabled={isLoading}
                >
                    전송하기
                </button>
            </form>
            {isLoading && (
                <div
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '10px 20px',
                        backgroundColor: '#333',
                        color: 'white',
                        borderRadius: '5px',
                        fontSize: '18px',
                        textAlign: 'center',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    로딩 중...
                </div>
            )}
            {successMessage && (
                <div
                    style={{
                        position: 'fixed',
                        top: '60%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '10px 20px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '5px',
                        fontSize: '18px',
                        textAlign: 'center',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {successMessage}
                </div>
            )}
        </div>
    );
}

export default DataInputForm;

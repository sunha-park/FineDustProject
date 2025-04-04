import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 서버에 로그인 요청
            const response = await axios.post('http://34.64.136.227:5000/login', { username, password });

            if (response.data.token) {
                // 토큰 저장 (로컬 스토리지 또는 쿠키)
                localStorage.setItem('authToken', response.data.token);

                // 관리자 페이지로 이동
                navigate('/admin');
            }
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#EAEDED', // 더 밝은 배경 색상
                padding: '20px',
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    padding: '40px',
                    border: 'none', // 기존 테두리 제거
                    borderRadius: '12px', // 둥근 모서리
                    backgroundColor: '#FFFFFF', // 흰색 배경
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)', // 더 부드러운 그림자
                    maxWidth: '400px',
                    width: '100%', // 반응형
                }}
            >
                <h2
                    style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        color: '#007BFF',
                        fontSize: '24px',
                        fontWeight: '600',
                    }}
                >
                    관리자 로그인
                </h2>
    
                {error && (
                    <p
                        style={{
                            color: 'red',
                            textAlign: 'center',
                            marginBottom: '20px',
                            fontSize: '14px',
                        }}
                    >
                        {error}
                    </p>
                )}
    
                <div style={{ marginBottom: '25px' }}>
                    <label
                        htmlFor="username"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#555',
                        }}
                    >
                        사용자 이름
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                            width: '100%',
                            border: '1px solid #ddd',
                            padding: '15px 0px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#333',
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                        }}
                        required
                    />
                </div>
    
                <div style={{ marginBottom: '25px' }}>
                    <label
                        htmlFor="password"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#555',
                        }}
                    >
                        비밀번호
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '15px 0px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#333',
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                        }}
                        required
                    />
                </div>
    
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#007BFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#007BFF')}
                >
                    로그인
                </button>
            </form>
        </div>
    );
}    

export default LoginPage;

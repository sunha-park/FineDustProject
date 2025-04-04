import React, { useState, useEffect } from 'react';
import DataInputForm from './DataInputForm';
import ExcelUpload from './ExcelUpload';
import { useNavigate } from 'react-router-dom';
import AirQualityData from './AirQualityData';

function AdminPage() {
    const navigate = useNavigate(); // navigate 정의

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // 토큰 삭제
        navigate('/login'); // 로그인 페이지로 이동
    };

    // 공통 스타일 변수
    const sectionStyle = {
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f7f7f7',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    };

    const headerStyle = {
        paddingLeft: '10px',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #007BFF',
        color: '#333',
    };

    return (
        <div
            style={{
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#f4f6f8',
                minHeight: '100vh',
                padding: '30px',
            }}
        >
            <header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    zIndex: 1000,
                    display: 'flex', // 플렉스 컨테이너 설정
                    justifyContent: 'space-between', // 좌우 정렬
                    alignItems: 'center', // 세로 가운데 정렬
                    padding: '10px 20px', // 상하좌우 여백
                    textAlign: 'center',
                    backgroundColor: '#007BFF',
                    color: 'white',
                }}
            >
                {/* 헤더 좌측: 제목과 설명 */}
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '30px' }}>관리자 페이지</h1>
                </div>

                {/* 헤더 우측: 버튼 그룹 */}
                <div style={{ display: 'flex', gap: '10px', marginRight: '70px' }}> {/* 버튼 간격 10px 설정 */}
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '10px 20px',
                            background: 'None',
                            color: 'white',
                            border: '1px solid white', // 테두리 추가로 시각적 구분
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        로그아웃
                    </button>
                    <button
                        onClick={() => window.location.href = '/'} // 메인 페이지로 이동
                        style={{
                            padding: '10px 20px',
                            background: 'None',
                            color: 'white',
                            border: '1px solid white', // 테두리 추가로 시각적 구분
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        메인 페이지
                    </button>
                </div>
            </header>

            <main
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginTop: '150px',
                }}
            >
                {/* 좌측: Data Input */}
                <div style={sectionStyle}>
                    <h2 style={headerStyle}>Data Input</h2>
                    <DataInputForm />
                </div>

                {/* 우측: Excel Upload 및 Data Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Excel Upload */}
                    <div style={sectionStyle}>
                        <h2 style={headerStyle}>Excel Upload</h2>
                        <ExcelUpload />
                    </div>

                    {/* Air Quality Table */}
                    <div style={sectionStyle}>
                        <h2 style={headerStyle}>Air Quality Data</h2>
                        <AirQualityData />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminPage;

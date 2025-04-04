import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';

function AirQualityData() {
    const [data, setData] = useState([]); // 데이터 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState(null); // 에러 상태

    // 데이터 가져오는 함수
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://34.64.136.227:5000/air_quality');
            const responseData = response.data?.data || []; // undefined일 경우 빈 배열 설정
            setData(responseData);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
};

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    const columnDefs = [
        { headerName: '날짜', field: 'date', sortable: true, filter: true },
        { headerName: 'SO2', field: 'SO2', sortable: true, filter: true },
        { headerName: 'NO2', field: 'NO2', sortable: true, filter: true },
        { headerName: 'O3', field: 'O3', sortable: true, filter: true },
        { headerName: 'CO', field: 'CO', sortable: true, filter: true },
        { headerName: 'PM10', field: 'PM10', sortable: true, filter: true },
        { headerName: 'PM2.5', field: 'PM25', sortable: true, filter: true },
    ];

    return (
        <div>
            <div>
                <button
                    onClick={fetchData}
                    style={{
                        display: 'block',
                        marginBottom: '20px',
                        padding: '10px 20px',
                        background: '#007BFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    새로고침
                </button>
            </div>
            <div>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#007BFF' }}>Loading data...</p>
                ) : error ? (
                    <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>
                ) : data.length > 0 ? ( // data.length 확인
                    <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
                        <AgGridReact columnDefs={columnDefs} rowData={data} pagination paginationPageSize={12} />
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: 'gray' }}>No data available</p>
                )}
            </div>
        </div>
    );
}

export default AirQualityData;

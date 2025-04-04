import React, { useState, useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables)

function HomePage() {
    const chartRef = useRef(null);
    const predictionChartRef = useRef(null); // 예측 차트를 위한 useRef 추가
    const [labels, setLabels] = useState([]);
    const [pm25Values, setPm25Values] = useState([]);
    const [predictedValues, setPredictedValues] = useState([]);
    const [filteredLabels, setFilteredLabels] = useState([]);
    const [filteredPm25Values, setFilteredPm25Values] = useState([]);
    const [filteredPredictedValues, setFilteredPredictedValues] = useState([]);
    const [predictionLabels, setPredictionLabels] = useState([]); // 예측 날짜 상태 추가
    const [predictionValues, setPredictionValues] = useState([]); // 예측 PM2.5 값 상태 추가
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [chartType, setChartType] = useState('line'); // 기본값 꺾은선 그래프

    // 페이지 로드 시 전체 데이터를 가져옴
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const response = await fetch('http://34.64.136.227:5000/all_data');
                if (!response.ok) throw new Error('Failed to fetch data');
                const result = await response.json();
    
                const allData = result.data;
                const dateRange = result.date_range;
    
                // 상태 업데이트
                setLabels(allData.map((item) => item.date));
                setPm25Values(allData.map((item) => item.PM25));
                setPredictedValues(allData.map((item) => item.predicted_pm25));
                setFilteredLabels(allData.map((item) => item.date));
                setFilteredPm25Values(allData.map((item) => item.PM25));
                setFilteredPredictedValues(allData.map((item) => item.predicted_pm25));
                setMinDate(dateRange.min_date);
                setMaxDate(dateRange.max_date);
    
                // 차트 생성
                generateChart(
                    allData.map((item) => item.date),
                    allData.map((item) => item.PM25),
                    allData.map((item) => item.predicted_pm25),
                    chartType
                );
            } catch (error) {
                console.error('Error:', error);
            }
        };
    
        fetchAllData();
    }, [chartType]); // 빈 배열로 설정해 컴포넌트가 마운트될 때 한 번만 실행
    
    // 향후 3일 예측 데이터 가져오기
    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const response = await fetch('http://34.64.136.227:5000/predict_next_days');
                if (!response.ok) throw new Error('Failed to fetch predictions');
                const result = await response.json();
                setPredictionLabels(result.predictions.map((p) => p.date));
                setPredictionValues(result.predictions.map((p) => p.predicted_pm25));

                generatePredictionChart(
                    result.predictions.map((p) => p.date),
                    result.predictions.map((p) => p.predicted_pm25)
                );
            } catch (error) {
                console.error('Error fetching predictions:', error);
            }
        };

        fetchPredictions();
    }, []);

    const generateChart = (labels, pm25Values, predictedValues, type) => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }
        
        if (!['line', 'bar'].includes(type)) {
            console.error(`Invalid chart type: ${type}`);
            return;
        }

        const ctx = document.getElementById('chartCanvas').getContext('2d');
        chartRef.current = new Chart(ctx, {
            type,
            data: {
                labels,
                datasets: [
                    {
                        label: '실제 PM2.5',
                        data: pm25Values,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 2,
                    },
                    {
                        label: '예측 PM2.5',
                        data: predictedValues,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.raw}`,
                        },
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                        },
                        ticks: {
                            maxTicksLimit: 10,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'PM2.5',
                        },
                    },
                },
            },
        });
    };

    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert('시작일과 종료일을 모두 입력하세요.');
            return;
        }

        if (startDate < minDate || endDate > maxDate) {
            alert(`날짜 범위는 ${minDate}에서 ${maxDate} 사이여야 합니다.`);
            return;
        }

        const filteredLabels = labels.filter((date) => date >= startDate && date <= endDate);
        const filteredPm25Values = pm25Values.filter((_, index) => labels[index] >= startDate && labels[index] <= endDate);
        const filteredPredictedValues = predictedValues.filter((_, index) => labels[index] >= startDate && labels[index] <= endDate);

        setFilteredLabels(filteredLabels);
        setFilteredPm25Values(filteredPm25Values);
        setFilteredPredictedValues(filteredPredictedValues);
        generateChart(filteredLabels, filteredPm25Values, filteredPredictedValues, chartType);
    };

    const generatePredictionChart = (labels, values) => {
        if (predictionChartRef.current) {
            predictionChartRef.current.destroy();
        }

        const ctx = document.getElementById('predictionChart').getContext('2d');
        predictionChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '향후 3일 예측 PM2.5',
                        data: values,
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                        },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'PM2.5',
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false, //범례
                },
            },
        },
    });
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
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '30px' }}>메인 페이지</h1>
                </div>

                {/* 헤더 우측: 버튼 그룹 */}
                <div style={{ display: 'flex', gap: '10px', marginRight: '70px' }}> {/* 버튼 간격 10px 설정 */}
                    <button
                        onClick={() => window.location.href = '/login'}
                        style={{
                            padding: '10px 20px',
                            background: 'None',
                            color: 'white',
                            border: '1px solid white', // 테두리 추가로 시각적 구분
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        로그인
                    </button>
                </div>
            </header>

            <main style={{ marginTop: '70px', padding: '20px' }}>
                <h2 style={{ textAlign: 'center', margin: '50px'}}>PM2.5 (실제값 vs 예측값)</h2>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between', // 좌우 끝으로 배치
                        alignItems: 'center', // 세로 가운데 정렬
                        gap: '10px',
                        marginBottom: '20px',
                    }}
                >
                    {/* 필터 섹션 */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={minDate}
                            max={maxDate}
                            style={{
                                padding: '10px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                            }}
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={minDate}
                            max={maxDate}
                            style={{
                                padding: '10px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                            }}
                        />
                        <button
                            onClick={handleFilter}
                            style={{
                                padding: '10px 20px',
                                background: '#007BFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            필터 적용
                        </button>
                    </div>
                
                    {/* 드롭박스: 그래프 유형 선택 */}
                    <div style={{ marginBottom: '20px' }}>
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            style={{
                                padding: '10px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                            }}
                        >
                            <option value="line">꺾은선 그래프</option>
                            <option value="bar">막대 그래프</option>
                        </select>
                    </div>
                </div>

                <div
                    style={{
                        position: 'relative',
                        height: '400px',
                        marginTop: '30px',
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <canvas id="chartCanvas"></canvas>
                </div>
                {/* 예측 데이터 그래프 */}
                <div
                style={{
                    position: 'relative',
                    height: '500px',
                    marginTop: '30px',
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
                >
                    <h3 style={{ textAlign: 'center' }}>향후 3일 PM2.5 예측</h3>
                    <canvas id="predictionChart"></canvas>
                </div>
            </main>
        </div>
    );
}
export default HomePage;
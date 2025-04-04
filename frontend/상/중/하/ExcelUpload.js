import React, { useState } from 'react';
import axios from 'axios';

function ExcelUpload() {
    const [action, setAction] = useState('insert'); // 기본 작업은 'insert'
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 관리

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsLoading(true); // 로딩 시작
            let apiEndpoint = '';
            switch (action) {
                case 'insert':
                    apiEndpoint = 'http://34.64.136.227:5000/insert_excel';
                    break;
                case 'update':
                    apiEndpoint = 'http://34.64.136.227:5000/update_excel';
                    break;
                case 'delete':
                    apiEndpoint = 'http://34.64.136.227:5000/delete_excel';
                    break;
                case 'fine_tune': // Fine-tuning 작업
                    apiEndpoint = 'http://34.64.136.227:5000/fine_tune';
                    break;
                default:
                    throw new Error('Invalid action');
            }

            const response = await axios.post(apiEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(response.data.message); // 서버 성공 메시지 출력
        } catch (error) {
            console.error('Error during upload:', error); // 콘솔에 전체 에러 출력
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
            alert(errorMessage); // 사용자에게 에러 메시지 출력
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px'}}>

            {/* 작업 선택 드롭다운 */}
            <label htmlFor="action" style={{ marginRight: '10px', color: '#555', fontWeight: 'bold' }}>작업 선택:</label>
            <br/>
            <select
                id="action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                style={{
                    padding: '10px',
                    marginBottom: '20px',
                    marginRight: '10px',
                    marginLeft: '20px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '16px',
                    maxWidth: '500px',
                    width: '100%',
                }}
            >
                <option value="insert">데이터 추가하기 (Insert)</option>
                <option value="update">데이터 수정하기 (Update)</option>
                <option value="delete">데이터 삭제하기 (Delete)</option>
                <option value="fine_tune">모델 재학습 (Fine tuning)</option> {/* Fine-tuning 추가 */}
            </select>

            {/* 파일 업로드 버튼 */}
            <div style={{ position: 'relative', display: 'inline-block', marginTop: '20px' }}>
                <label
                    htmlFor="file-upload"
                    style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: isLoading ? '#cccccc' : '#007BFF',
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        borderRadius: '5px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s',
                        boxShadow: isLoading ? 'none' : '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {isLoading ? '업로드 중...' : '파일 업로드'}
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx"
                    onChange={handleUpload}
                    style={{
                        display: 'none', // 실제 입력 버튼은 숨김
                    }}
                    disabled={isLoading} // 로딩 중에는 버튼 비활성화
                />
            </div>
        </div>
    );
}

export default ExcelUpload;
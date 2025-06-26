import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '@mantine/core';
import { useBatchFileUpload } from '../hooks/useBatchFileUpload';
import { FileUploadSection } from '../components/FileUploadSection';

export const UploadPage = () => {
    const navigate = useNavigate();
    const { custom_id } = useParams<{ custom_id?: string }>();
    
    const handleSuccess = () => {
        if (custom_id) {
            navigate(`/album/${custom_id}`);
        } else {
            navigate('/');
        }
    };

    const handleFileReject = () => {
        console.log('Files rejected');
    };

    // 分割アップロードのみ使用
    const batchFileUpload = useBatchFileUpload(custom_id, handleSuccess);

    return (
        <Container my="md">
            <FileUploadSection
                customId={custom_id}
                batchUploadState={batchFileUpload.uploadState}
                onBatchFilesSelect={batchFileUpload.setFiles}
                onBatchUploadStart={batchFileUpload.startUpload}
                onBatchRetryFile={batchFileUpload.retryFile}
                onBatchRemoveFile={batchFileUpload.removeFile}
                onBatchClearFiles={batchFileUpload.clearFiles}
                onFilesReject={handleFileReject}
            />
        </Container>
    );
};

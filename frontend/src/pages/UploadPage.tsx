import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '@mantine/core';
import { useFileUpload } from '../hooks/useFileUpload';
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

    // 従来の一括アップロード用
    const fileUpload = useFileUpload(custom_id, handleSuccess);

    // 新しいバッチアップロード用
    const batchFileUpload = useBatchFileUpload(custom_id, handleSuccess);

    return (
        <Container my="md">
            <FileUploadSection
                customId={custom_id}
                // 従来の一括アップロード用
                files={fileUpload.files}
                uploading={fileUpload.uploading}
                onFilesSelect={fileUpload.setFiles}
                onFilesReject={fileUpload.handleFileReject}
                onUpload={fileUpload.uploadFiles}
                onClearSelection={fileUpload.clearSelection}
                // 新しいバッチアップロード用
                batchUploadState={batchFileUpload.uploadState}
                onBatchFilesSelect={batchFileUpload.setFiles}
                onBatchUploadStart={batchFileUpload.startUpload}
                onBatchRetryFile={batchFileUpload.retryFile}
                onBatchRemoveFile={batchFileUpload.removeFile}
                onBatchClearFiles={batchFileUpload.clearFiles}
            />
        </Container>
    );
};

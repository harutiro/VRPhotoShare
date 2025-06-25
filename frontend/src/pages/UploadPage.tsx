import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '@mantine/core';
import { useFileUpload } from '../hooks/useFileUpload';
import { FileUploadSection } from '../components/FileUploadSection';

export const UploadPage = () => {
    const navigate = useNavigate();
    const { custom_id } = useParams<{ custom_id?: string }>();
    
    const fileUpload = useFileUpload(custom_id, () => {
        if (custom_id) {
            navigate(`/album/${custom_id}`);
        } else {
            navigate('/');
        }
    });

    return (
        <Container my="md">
            <FileUploadSection
                customId={custom_id}
                files={fileUpload.files}
                uploading={fileUpload.uploading}
                onFilesSelect={fileUpload.setFiles}
                onFilesReject={fileUpload.handleFileReject}
                onUpload={fileUpload.uploadFiles}
                onClearSelection={fileUpload.clearSelection}
            />
        </Container>
    );
};

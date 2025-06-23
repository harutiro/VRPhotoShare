import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Title, Text, Group, Button, SimpleGrid, Image } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE, type FileWithPath } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import axios from 'axios';

export const UploadPage = () => {
    const navigate = useNavigate();
    const { custom_id } = useParams<{ custom_id?: string }>();
    const [files, setFiles] = useState<FileWithPath[]>([]);
    const [uploading, setUploading] = useState(false);

    const previews = files.map((file, index) => {
        const imageUrl = URL.createObjectURL(file);
        return <Image key={index} src={imageUrl} onLoad={() => URL.revokeObjectURL(imageUrl)} />;
    });

    const fileToBase64 = (file: File): Promise<{name: string, data: string}> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({
                name: file.name,
                data: (reader.result as string).split(',')[1]
            });
            reader.onerror = (error) => reject(error);
        });
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            notifications.show({ title: 'No files', message: 'Please select files to upload.', color: 'red' });
            return;
        }

        setUploading(true);
        try {
            const encodedFiles = await Promise.all(files.map(fileToBase64));
            
            // If custom_id exists, upload to the album. Otherwise, upload without album association.
            const url = custom_id ? `/api/albums/${custom_id}/photos` : '/api/photos';
            const response = await axios.post(url, encodedFiles);

            if (response.status !== 201) {
                const errorData = response.data;
                throw new Error(errorData.error || 'Upload failed due to a server error.');
            }

            notifications.show({ title: 'Success', message: 'All photos uploaded successfully!', color: 'green' });
            setFiles([]); // Clear selection
            
            // Navigate to the correct page after upload
            if (custom_id) {
                navigate(`/album/${custom_id}`);
            } else {
                navigate('/'); // This case is currently not used from the UI, but kept for robustness
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred.';
            notifications.show({ title: 'Upload Error', message: errorMessage, color: 'red' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container my="md">
            <Title order={2} mb="lg">
                {custom_id ? `Upload Photos to Album` : 'Upload Photos'}
            </Title>
            <Text c="dimmed" mb="lg">
                {custom_id
                    ? 'These photos will be added to the current album.'
                    : 'Upload your photos here. They will be displayed on the homepage.'
                }
            </Text>
            <Dropzone
                onDrop={setFiles}
                onReject={(rejectedFiles) => {
                    console.log('rejected files', rejectedFiles);
                    notifications.show({
                        title: 'File Rejected',
                        message: 'Some files were rejected. Please ensure they are images and under 10MB.',
                        color: 'red'
                    });
                }}
                maxSize={10 * 1024 ** 2} // 10MB
                accept={IMAGE_MIME_TYPE}
            >
                <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                        <IconUpload size="3.2rem" stroke={1.5} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                        <IconX size="3.2rem" stroke={1.5} color="red" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                        <IconPhoto size="3.2rem" stroke={1.5} />
                    </Dropzone.Idle>
                    <div>
                        <Text size="xl" inline>Drag images here or click to select files</Text>
                        <Text size="sm" c="dimmed" inline mt={7}>Attach as many files as you like, each file should not exceed 10MB.</Text>
                    </div>
                </Group>
            </Dropzone>

            {files.length > 0 && (
                <>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} mt="xl">
                        {previews}
                    </SimpleGrid>

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={() => setFiles([])} disabled={uploading}>
                            Clear selection
                        </Button>
                        <Button onClick={handleUpload} loading={uploading}>
                            Upload {files.length} {files.length === 1 ? 'photo' : 'photos'}
                        </Button>
                    </Group>
                </>
            )}
        </Container>
    );
};

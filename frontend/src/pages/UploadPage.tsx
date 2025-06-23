import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, TextInput, Textarea, FileInput, Button, Group, LoadingOverlay } from '@mantine/core';

export const UploadPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!file || !title) {
      alert('Title and file are required.');
      return;
    }

    setUploading(true);

    try {
      const imageData = await fileToBase64(file);
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, imageData }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container my="md">
      <LoadingOverlay visible={uploading} />
      <Title order={2}>Upload Photo</Title>
      <TextInput
        label="Title"
        placeholder="Enter a title for your photo"
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
        required
        my="md"
      />
      <Textarea
        label="Description"
        placeholder="Enter a description"
        value={description}
        onChange={(event) => setDescription(event.currentTarget.value)}
        my="md"
      />
      <FileInput
        label="Photo"
        placeholder="Select a photo"
        value={file}
        onChange={setFile}
        accept="image/png,image/jpeg"
        required
        my="md"
      />
      <Group justify="flex-end" mt="md">
        <Button onClick={handleSubmit} disabled={uploading}>
          Upload
        </Button>
      </Group>
    </Container>
  );
};

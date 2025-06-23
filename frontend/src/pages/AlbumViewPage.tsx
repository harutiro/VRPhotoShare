import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Grid, Card, Image, Text, Center, Button, Group, ActionIcon,
  Checkbox, Modal, Stack, Box, LoadingOverlay, Tooltip,
} from '@mantine/core';
import { useDisclosure, useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconTrash, IconShare } from '@tabler/icons-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Photo {
  id: number;
  name: string;
  data: string;
  url: string;
}

interface Album {
    id: number;
    custom_id: string;
    name:string;
}

export const AlbumViewPage = () => {
  const { custom_id } = useParams<{ custom_id: string }>();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const clipboard = useClipboard({ timeout: 500 });

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const albumResponse = await fetch(`/api/albums/${custom_id}`);
        if (albumResponse.status === 404) {
          throw new Error('Album not found. Check the ID and try again.');
        }
        if (!albumResponse.ok) {
          throw new Error('Failed to fetch album details.');
        }
        const albumData = await albumResponse.json();
        setAlbum(albumData);

        const photosResponse = await fetch(`/api/albums/${custom_id}/photos`);
        if (!photosResponse.ok) {
            throw new Error('Failed to fetch photos for the album.');
        }
        const photosData = await photosResponse.json();
        setPhotos(photosData);

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (custom_id) {
        fetchAlbumDetails();
    }
  }, [custom_id]);
  
  const handlePhotoClick = (photo: Photo) => {
    setCurrentPhoto(photo);
    openModal();
  };

  const handleSelectionChange = (id: number, checked: boolean) => {
    setSelectedPhotos((prev) =>
      checked ? [...prev, id] : prev.filter((photoId) => photoId !== id)
    );
  };

  const handleDelete = async (photoId: number) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete photo.');
      
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedPhotos(prev => prev.filter(id => id !== photoId));
      notifications.show({ title: 'Success', message: 'Photo deleted.', color: 'green' });
      if (currentPhoto?.id === photoId) closeModal();

    } catch (err) {
        if (err instanceof Error) {
            notifications.show({ title: 'Error', message: err.message, color: 'red' });
        } else {
            notifications.show({ title: 'Error', message: "An unknown error occurred", color: 'red' });
        }
    }
  };

  const handleIndividualDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDownload = async () => {
    if (selectedPhotos.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const photosToDownload = photos.filter(p => selectedPhotos.includes(p.id));

      for (const photo of photosToDownload) {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        zip.file(photo.name, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${album?.name || 'album'}.zip`);
      
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create ZIP file.', color: 'red' });
    } finally {
      setIsZipping(false);
    }
  };

  if (loading) {
    return <Container my="md">{/* Skeleton loader */}</Container>;
  }

  if (error) {
    return <Container my="md"><Center><Text color="red" size="xl">{error}</Text></Center></Container>;
  }

  return (
    <>
      <Modal 
        opened={modalOpened} 
        onClose={closeModal} 
        title={currentPhoto?.name} 
        size="xl" 
        zIndex={200}
        styles={{
          inner: {
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '5%',
          },
        }}
      >
        {currentPhoto && (
          <Stack>
            <img
              src={currentPhoto.url}
              alt={currentPhoto.name}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                display: 'block',
                margin: 'auto'
              }}
            />
            <Group justify="flex-end" mt="md">
              <Button leftSection={<IconDownload size={14} />} onClick={() => handleIndividualDownload(currentPhoto)}>Download</Button>
              <Button color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(currentPhoto.id)}>Delete</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Container my="md" pos="relative">
        <LoadingOverlay visible={isZipping} overlayProps={{ radius: "sm", blur: 2 }} />

        <Group justify="space-between" mb="lg">
          <Stack gap="xs">
              <Title order={2}>{album?.name}</Title>
              <Text c="dimmed">{photos.length} photos</Text>
          </Stack>
          <Group>
              <Button
                  onClick={handleBulkDownload}
                  disabled={selectedPhotos.length === 0 || isZipping}
                  leftSection={<IconDownload size={14} />}
              >
                  Download ({selectedPhotos.length})
              </Button>
              <Button onClick={() => navigate(`/album/${custom_id}/upload`)}>Upload Photos</Button>
              <Tooltip label="Copy album link to clipboard">
                <ActionIcon 
                  variant="default" 
                  size="lg" 
                  onClick={() => {
                    clipboard.copy(window.location.href);
                    notifications.show({
                      title: 'Link Copied!',
                      message: 'The album link has been copied to your clipboard.',
                      color: 'green',
                    });
                  }}
                >
                  <IconShare size={16} />
                </ActionIcon>
              </Tooltip>
          </Group>
        </Group>

        {photos.length === 0 && !loading ? (
          <Center><Text>This album is empty. Upload some photos!</Text></Center>
        ) : (
          <Grid>
            {photos.map((photo) => (
              <Grid.Col key={photo.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card shadow="sm" padding={0} radius="md" withBorder>
                  <Box pos="relative">
                      <Checkbox
                          pos="absolute" top={10} left={10}
                          style={{ zIndex: 1 }}
                          checked={selectedPhotos.includes(photo.id)}
                          onChange={(e) => handleSelectionChange(photo.id, e.currentTarget.checked)}
                          aria-label="Select photo"
                      />
                       <ActionIcon variant="filled" color="red" radius="xl" size="sm"
                          pos="absolute" top={10} right={10}
                          style={{ zIndex: 1 }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                          title="Delete Photo"
                      >
                          <IconTrash size={14} />
                      </ActionIcon>
                      <Card.Section>
                          <Image
                              src={photo.url}
                              height={180}
                              alt={photo.name}
                              onClick={() => handlePhotoClick(photo)}
                              style={{ cursor: 'pointer' }}
                          />
                      </Card.Section>
                  </Box>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

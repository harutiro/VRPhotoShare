import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Group, TextInput, Button, Text, Stack, Card, Grid } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const [albumId, setAlbumId] = useState('');

  const handleViewAlbum = () => {
    if (albumId.trim()) {
      navigate(`/album/${albumId.trim()}`);
    }
  };

  return (
    <Container size="lg" my="xl">
      <Stack gap="xl">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="md" p="xl" withBorder h="100%">
              <Title order={2} ta="center">Create a New Album</Title>
              <Text c="dimmed" ta="center" mt="sm" mb="lg">
                Start by creating a new album to share your photos.
              </Text>
              <Group justify="center">
                <Button size="lg" onClick={() => navigate('/create-album')}>
                  Create Album
                </Button>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="md" p="xl" withBorder h="100%">
              <Title order={2} ta="center">View an Existing Album</Title>
              <Text c="dimmed" ta="center" mt="sm" mb="lg">
                Enter the Album ID to view the photos.
              </Text>
              <Group justify="center">
                <TextInput
                  size="lg"
                  placeholder="Enter Album ID"
                  value={albumId}
                  onChange={(e) => setAlbumId(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewAlbum()}
                />
                <Button size="lg" onClick={handleViewAlbum} disabled={!albumId.trim()}>
                  <IconSearch size={18} style={{ marginRight: '8px' }} />
                  View Album
                </Button>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="sm">How to Use VR Photo Share</Title>
          <Stack gap="xs">
            <Text>1. **Create an Album**: Click the "Create Album" button, choose a name and a unique ID for your album.</Text>
            <Text>2. **Upload Photos**: After creating the album, you can upload your photos. Drag and drop multiple files at once!</Text>
            <Text>3. **Share**: Share the album ID with your friends. They can enter the ID on this page to view your photos.</Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

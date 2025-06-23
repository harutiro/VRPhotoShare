import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, TextInput, Button, Group, Stack, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export const CreateAlbumPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !customId.trim()) {
      notifications.show({
        title: 'Input Error',
        message: 'Album Name and Album ID are required.',
        color: 'red',
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, custom_id: customId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create album.');
      }

      notifications.show({
        title: 'Success!',
        message: `Album "${name}" created successfully.`,
        color: 'green',
      });
      navigate(`/album/${customId}`);
    } catch (error: any) {
      notifications.show({
        title: 'Creation Failed',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" my="xl">
        <Paper shadow="md" p="xl" withBorder>
            <Title order={2} ta="center" mb="lg">Create New Album</Title>
            <Stack>
                <TextInput
                    label="Album Name"
                    placeholder="e.g., Summer Vacation 2025"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    required
                />
                <TextInput
                    label="Album ID"
                    placeholder="e.g., summer-2025 (must be unique)"
                    description="This ID will be used in the URL to share your album."
                    value={customId}
                    onChange={(e) => setCustomId(e.currentTarget.value)}
                    required
                />
                <Group justify="flex-end" mt="md">
                    <Button onClick={handleCreate} loading={loading}>
                        Create Album
                    </Button>
                </Group>
            </Stack>
        </Paper>
    </Container>
  );
};

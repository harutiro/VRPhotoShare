import { useState } from 'react';
import { Paper, Title, Text, Group, TextInput, Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface ViewAlbumSectionProps {
  onViewAlbum: (albumId: string) => void;
}

export const ViewAlbumSection = ({ onViewAlbum }: ViewAlbumSectionProps) => {
  const [albumId, setAlbumId] = useState('');

  const handleViewAlbum = () => {
    if (albumId.trim()) {
      onViewAlbum(albumId.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleViewAlbum();
    }
  };

  return (
    <Paper shadow="md" p="xl" withBorder h="100%">
      <Title order={2} ta="center">既存のアルバムを表示</Title>
      <Text c="dimmed" ta="center" mt="sm" mb="lg">
        アルバムIDを入力して写真を表示します。
      </Text>
      <Group justify="center">
        <TextInput
          size="lg"
          placeholder="アルバムIDを入力"
          value={albumId}
          onChange={(e) => setAlbumId(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Button size="lg" onClick={handleViewAlbum} disabled={!albumId.trim()}>
          <IconSearch size={18} style={{ marginRight: '8px' }} />
          アルバムを表示
        </Button>
      </Group>
    </Paper>
  );
}; 
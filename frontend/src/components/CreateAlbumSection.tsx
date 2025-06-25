import { Paper, Title, Text, Group, Button } from '@mantine/core';

interface CreateAlbumSectionProps {
  onCreateAlbum: () => void;
}

export const CreateAlbumSection = ({ onCreateAlbum }: CreateAlbumSectionProps) => {
  return (
    <Paper shadow="md" p="xl" withBorder h="100%">
      <Title order={2} ta="center">新しいアルバムを作成</Title>
      <Text c="dimmed" ta="center" mt="sm" mb="lg">
        まずは新しいアルバムを作成して写真を共有しましょう。
      </Text>
      <Group justify="center">
        <Button size="lg" onClick={onCreateAlbum}>
          アルバム作成
        </Button>
      </Group>
    </Paper>
  );
}; 
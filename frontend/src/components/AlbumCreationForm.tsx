import { Title, TextInput, Button, Group, Stack, Paper } from '@mantine/core';

interface AlbumCreationFormProps {
  name: string;
  customId: string;
  loading: boolean;
  onNameChange: (value: string) => void;
  onCustomIdChange: (value: string) => void;
  onSubmit: () => void;
}

export const AlbumCreationForm = ({
  name,
  customId,
  loading,
  onNameChange,
  onCustomIdChange,
  onSubmit
}: AlbumCreationFormProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <Paper shadow="md" p="xl" withBorder>
      <Title order={2} ta="center" mb="lg">新しいアルバムを作成</Title>
      <Stack>
        <TextInput
          label="アルバム名"
          placeholder="例: 夏休み2025"
          value={name}
          onChange={(e) => onNameChange(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
        />
        <TextInput
          label="アルバムID"
          placeholder="例: summer-2025（他と重複しないID）"
          description="このIDはURLでアルバムを共有する際に使います。"
          value={customId}
          onChange={(e) => onCustomIdChange(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={onSubmit} loading={loading}>
            アルバム作成
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}; 
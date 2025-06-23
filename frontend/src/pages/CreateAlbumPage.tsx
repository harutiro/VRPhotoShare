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
        title: '入力エラー',
        message: 'アルバム名とアルバムIDは必須です。',
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
        title: '作成成功',
        message: `アルバム「${name}」を作成しました。`,
        color: 'green',
      });
      navigate(`/album/${customId}`);
    } catch (error: any) {
      notifications.show({
        title: '作成失敗',
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
            <Title order={2} ta="center" mb="lg">新しいアルバムを作成</Title>
            <Stack>
                <TextInput
                    label="アルバム名"
                    placeholder="例: 夏休み2025"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    required
                />
                <TextInput
                    label="アルバムID"
                    placeholder="例: summer-2025（他と重複しないID）"
                    description="このIDはURLでアルバムを共有する際に使います。"
                    value={customId}
                    onChange={(e) => setCustomId(e.currentTarget.value)}
                    required
                />
                <Group justify="flex-end" mt="md">
                    <Button onClick={handleCreate} loading={loading}>
                        アルバム作成
                    </Button>
                </Group>
            </Stack>
        </Paper>
    </Container>
  );
};

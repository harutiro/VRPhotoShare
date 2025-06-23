import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Group, TextInput, Button, Text, Stack, Card, Grid } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export const HomePage = () => {
  const navigate = useNavigate();
  const [albumId, setAlbumId] = useState('');

  const handleViewAlbum = async () => {
    if (!albumId.trim()) return;
    // 事前に存在確認
    try {
      const res = await fetch(`/api/albums/${albumId.trim()}`);
      if (res.status === 404) {
        notifications.show({
          title: 'エラー',
          message: '指定されたアルバムIDのアルバムは存在しません。',
          color: 'red',
        });
        return;
      }
      if (!res.ok) throw new Error();
      navigate(`/album/${albumId.trim()}`);
    } catch {
      notifications.show({
        title: 'エラー',
        message: 'アルバムの検索中にエラーが発生しました。',
        color: 'red',
      });
    }
  };

  return (
    <Container size="lg" my="xl">
      <Stack gap="xl">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="md" p="xl" withBorder h="100%">
              <Title order={2} ta="center">新しいアルバムを作成</Title>
              <Text c="dimmed" ta="center" mt="sm" mb="lg">
                まずは新しいアルバムを作成して写真を共有しましょう。
              </Text>
              <Group justify="center">
                <Button size="lg" onClick={() => navigate('/create-album')}>
                  アルバム作成
                </Button>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
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
                  onKeyDown={(e) => e.key === 'Enter' && handleViewAlbum()}
                />
                <Button size="lg" onClick={handleViewAlbum} disabled={!albumId.trim()}>
                  <IconSearch size={18} style={{ marginRight: '8px' }} />
                  アルバムを表示
                </Button>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="sm">使い方</Title>
          <Stack gap="xs">
            <Text>1. <b>アルバム作成</b>: 「アルバム作成」ボタンをクリックし、名前とIDを決めてください。</Text>
            <Text>2. <b>写真をアップロード</b>: アルバム作成後、写真をアップロードできます。複数ファイルもOK！</Text>
            <Text>3. <b>共有</b>: アルバムIDを友達に教えて、このページでIDを入力してもらいましょう。</Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

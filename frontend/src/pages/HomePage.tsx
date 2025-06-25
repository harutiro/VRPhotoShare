import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Group, TextInput, Button, Text, Stack, Card, Grid, Alert, Box } from '@mantine/core';
import { IconSearch, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface ViewedAlbum {
  custom_id: string;
  name: string;
  viewedAt: string;
}

interface AlbumThumbnail {
  id: number;
  name: string;
  url: string;
  thumbnailUrl?: string;
}

export const HomePage = () => {
  const navigate = useNavigate();
  const [albumId, setAlbumId] = useState('');
  const [viewedAlbums, setViewedAlbums] = useState<ViewedAlbum[]>([]);
  const [albumThumbnails, setAlbumThumbnails] = useState<Record<string, AlbumThumbnail | null>>({});

  // 閲覧履歴を取得
  const getViewedAlbums = (): ViewedAlbum[] => {
    try {
      const history = localStorage.getItem('viewedAlbums');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  // 初回ロード時に閲覧履歴を取得
  useEffect(() => {
    console.log('Loading viewed albums from localStorage');
    const albums = getViewedAlbums();
    console.log('Found viewed albums:', albums);
    setViewedAlbums(albums);
  }, []);

  // アルバムのサムネイルを取得
  const fetchAlbumThumbnail = async (customId: string) => {
    try {
      console.log(`Fetching thumbnail for album: ${customId}`);
      const response = await fetch(`/api/albums/${customId}/thumbnail`);
      console.log(`Thumbnail response for ${customId}:`, response.status);
      if (response.ok) {
        const thumbnail = await response.json();
        console.log(`Thumbnail data for ${customId}:`, thumbnail);
        return thumbnail;
      }
      console.log(`No thumbnail found for ${customId}`);
      return null;
    } catch (error) {
      console.error(`Error fetching thumbnail for ${customId}:`, error);
      return null;
    }
  };

  // 閲覧履歴のアルバムのサムネイルを取得
  useEffect(() => {
    const loadThumbnails = async () => {
      console.log('Loading thumbnails for albums:', viewedAlbums);
      if (viewedAlbums.length === 0) {
        console.log('No viewed albums, clearing thumbnails');
        setAlbumThumbnails({});
        return;
      }

      // 現在のサムネイルをクリア
      setAlbumThumbnails({});
      
      const thumbnails: Record<string, AlbumThumbnail | null> = {};
      
      for (const album of viewedAlbums.slice(0, 6)) {
        console.log(`Loading thumbnail for album: ${album.custom_id}`);
        const thumbnail = await fetchAlbumThumbnail(album.custom_id);
        thumbnails[album.custom_id] = thumbnail;
        // 1つずつ更新して即座に反映
        setAlbumThumbnails(prev => ({ ...prev, [album.custom_id]: thumbnail }));
      }
      
      console.log('Final thumbnails:', thumbnails);
    };

    // 少し遅延を入れてからサムネイルを読み込む
    const timeoutId = setTimeout(loadThumbnails, 100);
    return () => clearTimeout(timeoutId);
  }, [viewedAlbums.length]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container size="lg" my="xl">
      <Stack gap="xl">
        {/* アルファ版警告バナー */}
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="⚠️ アルファ版のご注意"
          color="orange"
          variant="light"
        >
          <Text size="sm">
            このシステムは<strong>アルファ版</strong>です。以下の点にご注意ください：
          </Text>
          <Stack gap="xs" mt="xs">
            <Text size="sm">• <strong>データ消失の可能性</strong>：予告なくアップロードした写真やアルバムが削除される場合があります</Text>
            <Text size="sm">• <strong>セキュリティレベル</strong>：本格運用レベルのセキュリティ対策は実装されていません</Text>
            <Text size="sm">• <strong>機能制限</strong>：予期しない動作やエラーが発生する可能性があります</Text>
            <Text size="sm">重要な写真は必ずバックアップを取ってからご利用ください。</Text>
          </Stack>
        </Alert>
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

        {/* 最近見たアルバム */}
        {viewedAlbums.length > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">最近見たアルバム</Title>
            <Grid>
              {viewedAlbums.slice(0, 6).map((album) => {
                const thumbnail = albumThumbnails[album.custom_id];
                return (
                  <Grid.Col key={album.custom_id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper 
                      shadow="xs" 
                      p={0}
                      withBorder 
                      style={{ cursor: 'pointer', overflow: 'hidden' }}
                      onClick={() => navigate(`/album/${album.custom_id}`)}
                    >
                      <Box pos="relative">
                        {/* サムネイル画像 */}
                        <Box
                          h={120}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: thumbnail && thumbnail.thumbnailUrl ? 'transparent' : '#f1f3f4',
                            backgroundImage: thumbnail && thumbnail.thumbnailUrl ? `url(${thumbnail.thumbnailUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          {(!thumbnail || !thumbnail.thumbnailUrl) && (
                            <Text c="dimmed" size="sm">
                              {thumbnail === null ? '画像なし' : '読み込み中...'}
                            </Text>
                          )}
                        </Box>
                        
                        {/* アルバム情報オーバーレイ */}
                        <Box
                          pos="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          bg="rgba(0, 0, 0, 0.7)"
                          p="sm"
                        >
                          <Stack gap="xs">
                            <Text fw={500} size="sm" c="white" truncate>
                              {album.name}
                            </Text>
                            <Text c="white" size="xs" opacity={0.8}>
                              ID: {album.custom_id}
                            </Text>
                            <Text c="white" size="xs" opacity={0.8}>
                              {formatDate(album.viewedAt)}
                            </Text>
                          </Stack>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid.Col>
                );
              })}
            </Grid>
            {viewedAlbums.length > 6 && (
              <Text c="dimmed" size="sm" ta="center" mt="md">
                他 {viewedAlbums.length - 6} 件
              </Text>
            )}
          </Card>
        )}

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="sm">使い方</Title>
          <Stack gap="xs">
            <Text>1. <b>アルバム作成</b>: 「アルバム作成」ボタンをクリックし、名前とIDを決めてください。</Text>
            <Text>2. <b>写真をアップロード</b>: アルバム作成後、写真をアップロードできます。複数ファイルもOK！</Text>
            <Text>3. <b>共有</b>: アルバムIDを友達に教えて、このページでIDを入力してもらいましょう。</Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="sm">💡 VRCXユーザーの方へ</Title>
          <Stack gap="xs">
            <Text>
              <b>VRCX</b>を使用してスクリーンショットを撮影すると、PNGファイルに自動的にメタデータが追加されます。
            </Text>
            <Text>
              このメタデータには<b>ワールド情報</b>（ワールド名など）が含まれており、
              アップロード時に自動的に読み取られて写真がワールドごとにグループ分けされます。
            </Text>
            <Text c="dimmed" size="sm">
              ※ VRCXを使用していない場合でも、近い時刻に撮影された他の写真のワールド情報を参考にグループ分けが行われます。
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

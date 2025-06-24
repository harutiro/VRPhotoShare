import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Grid, Card, Image, Text, Center, Button, Group, ActionIcon,
  Checkbox, Modal, Stack, Box, LoadingOverlay, Tooltip, TextInput,
} from '@mantine/core';
import { useDisclosure, useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconTrash, IconShare, IconArrowsSort, IconEdit, IconUpload, IconLink } from '@tabler/icons-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Photo {
  id: number;
  name: string;
  data: string;
  url: string;
  thumbnailUrl?: string;
  image_data?: string;
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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const clipboard = useClipboard({ timeout: 500 });

  const [editName, setEditName] = useState('');

  const [editModalOpened, setEditModalOpened] = useState(false);

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

        const photosResponse = await fetch(`/api/albums/${custom_id}/photos?sort=${sortOrder}`);
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
  }, [custom_id, sortOrder]);
  
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

  // すべて選択・すべて解除
  const allSelected = photos.length > 0 && selectedPhotos.length === photos.length;
  const isIndeterminate = selectedPhotos.length > 0 && selectedPhotos.length < photos.length;
  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedPhotos(photos.map((p) => p.id));
    } else {
      setSelectedPhotos([]);
    }
  };

  // ワールド情報がない写真に近傍ワールド名を割り当て（dateベース）
  const assignedPhotos = photos.map((photo, _idx, arr) => {
    let worldName = 'ワールド情報なし';
    let hasWorld = false;
    let photoDate: Date | null = null;
    if (photo.image_data) {
      try {
        const meta = JSON.parse(photo.image_data);
        if (meta && meta.world && meta.world.name) {
          worldName = meta.world.name;
          hasWorld = true;
        }
        if (meta && meta.date) {
          photoDate = new Date(meta.date);
        }
      } catch (e) { void e; /* メタデータ不正時は無視 */ }
    }
    if (!hasWorld && photoDate) {
      // 他のワールド情報あり写真のdateと最も近いものを探す
      let minDiff = Infinity;
      let nearestWorld: string | null = null;
      arr.forEach((other) => {
        if (other.image_data) {
          try {
            const meta = JSON.parse(other.image_data);
            if (meta && meta.world && meta.world.name && meta.date) {
              const otherDate = new Date(meta.date);
              const diff = Math.abs(photoDate.getTime() - otherDate.getTime());
              if (diff < minDiff) {
                minDiff = diff;
                nearestWorld = meta.world.name;
              }
            }
          } catch (e) { void e; }
        }
      });
      if (nearestWorld) {
        worldName = nearestWorld;
      }
    }
    return { ...photo, _assignedWorld: worldName };
  });

  // ワールドごとにグループ化
  const worldGroups: { [worldName: string]: typeof assignedPhotos } = {};
  assignedPhotos.forEach((photo) => {
    const worldName = photo._assignedWorld || 'ワールド情報なし';
    if (!worldGroups[worldName]) worldGroups[worldName] = [];
    worldGroups[worldName].push(photo);
  });

  // アルバム名編集開始
  const startEditName = () => {
    setEditName(album?.name || '');
    setEditModalOpened(true);
  };
  const saveEditName = async () => {
    if (!editName.trim() || !album) return;
    try {
      const res = await fetch(`/api/albums/${album.custom_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });
      if (!res.ok) throw new Error('アルバム名の更新に失敗しました');
      const updated = await res.json();
      setAlbum((prev) => prev ? { ...prev, name: updated.name } : prev);
      setEditModalOpened(false);
      notifications.show({ title: '成功', message: 'アルバム名を変更しました', color: 'green' });
    } catch (e) {
      void e;
      notifications.show({ title: 'エラー', message: 'アルバム名の変更に失敗しました', color: 'red' });
    }
  };

  const handleDeleteAlbum = async () => {
    if (!album) return;
    if (!window.confirm('本当にこのアルバムを削除しますか？この操作は元に戻せません。')) return;
    try {
      const res = await fetch(`/api/albums/${album.custom_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      notifications.show({ title: '削除完了', message: 'アルバムを削除しました', color: 'green' });
      navigate('/');
    } catch {
      notifications.show({ title: 'エラー', message: 'アルバムの削除に失敗しました', color: 'red' });
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
              <Button 
                leftSection={<IconLink size={14} />} 
                variant="light"
                onClick={() => {
                  const shareUrl = currentPhoto.thumbnailUrl || currentPhoto.url;
                  clipboard.copy(shareUrl);
                  notifications.show({
                    title: 'リンクをコピーしました',
                    message: 'サムネイル画像の直リンクをクリップボードにコピーしました。',
                    color: 'green',
                  });
                }}
              >
                リンクをコピー
              </Button>
              <Button leftSection={<IconDownload size={14} />} onClick={() => handleIndividualDownload(currentPhoto)}>Download</Button>
              <Button color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(currentPhoto.id)}>Delete</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={editModalOpened} onClose={() => setEditModalOpened(false)} title="アルバム名を編集" centered
        styles={{
          inner: {
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: 300,
            zIndex: 201,
          },
        }}
      >
        <TextInput
          value={editName}
          onChange={(e) => setEditName(e.currentTarget.value)}
          size="md"
          style={{ minWidth: 200 }}
          mb="md"
        />
        <Group justify="flex-end">
          <Button color="green" onClick={saveEditName}>保存</Button>
          <Button variant="default" onClick={() => setEditModalOpened(false)}>キャンセル</Button>
        </Group>
      </Modal>

      <Container my="md" pos="relative">
        <LoadingOverlay visible={isZipping} overlayProps={{ radius: "sm", blur: 2 }} />

        <Group justify="space-between" mb="lg" align="center">
          <Stack gap="xs">
            <Group align="center" gap="xs">
              <Title order={2} style={{ marginRight: 8 }}>{album?.name}</Title>
              <Tooltip label="アルバム名を編集">
                <ActionIcon variant="light" color="blue" onClick={startEditName} size="lg">
                  <IconEdit size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Text c="dimmed">{photos.length} photos</Text>
            <Checkbox
              label="すべて選択"
              checked={allSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAllChange(e.currentTarget.checked)}
              disabled={photos.length === 0}
            />
          </Stack>
          <Group gap="xs">
            <Tooltip label={sortOrder === 'desc' ? '新しい順' : '古い順'}>
              <ActionIcon
                variant="filled"
                color="gray"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                size="lg"
              >
                <IconArrowsSort size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="写真をアップロード">
              <ActionIcon
                variant="filled"
                color="blue"
                onClick={() => navigate(`/album/${custom_id}/upload`)}
                size="lg"
              >
                <IconUpload size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="選択した写真をダウンロード">
              <ActionIcon
                variant="filled"
                color="teal"
                onClick={handleBulkDownload}
                size="lg"
                disabled={selectedPhotos.length === 0 || isZipping}
              >
                <IconDownload size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="アルバムリンクをコピー">
              <ActionIcon
                variant="filled"
                color="gray"
                onClick={() => {
                  clipboard.copy(window.location.href);
                  notifications.show({
                    title: 'リンクをコピーしました',
                    message: 'アルバムリンクをクリップボードにコピーしました。',
                    color: 'green',
                  });
                }}
                size="lg"
              >
                <IconShare size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="アルバムを削除">
              <ActionIcon
                variant="filled"
                color="red"
                onClick={handleDeleteAlbum}
                size="lg"
              >
                <IconTrash size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {photos.length === 0 && !loading ? (
          <Center><Text>このアルバムは空です。写真をアップロードしてください。</Text></Center>
        ) : (
          <>
            {Object.entries(worldGroups).map(([world, groupPhotos]) => (
              <div key={world} style={{ marginBottom: 32 }}>
                <Title order={3} mb="xs">{world}</Title>
                <Grid>
                  {groupPhotos.map((photo) => (
                    <Grid.Col key={photo.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                      <Card shadow="sm" padding={0} radius="md" withBorder>
                        <Box pos="relative">
                            <Checkbox
                                pos="absolute" top={10} left={10}
                                style={{ zIndex: 1 }}
                                checked={selectedPhotos.includes(photo.id)}
                                onChange={(e) => handleSelectionChange(photo.id, e.currentTarget.checked)}
                                aria-label="写真を選択"
                            />
                             <ActionIcon variant="filled" color="red" radius="xl" size="sm"
                                pos="absolute" top={10} right={10}
                                style={{ zIndex: 1 }}
                                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                                title="写真を削除"
                            >
                                <IconTrash size={14} />
                            </ActionIcon>
                            <Card.Section>
                                <Image
                                    src={photo.thumbnailUrl || photo.url}
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
              </div>
            ))}
          </>
        )}
        <Center mt="md">
          <Button onClick={() => navigate(`/album/${custom_id}/upload`)}>写真をアップロード</Button>
        </Center>
      </Container>
    </>
  );
};

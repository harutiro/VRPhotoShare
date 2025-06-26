import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Text, Center, Button, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

// Types
import type { Photo } from '../types/photo';

// Components
import { PhotoModal } from '../components/PhotoModal';
import { AlbumEditModal } from '../components/AlbumEditModal';
import { AlbumHeader } from '../components/AlbumHeader';
import { PhotoGrid } from '../components/PhotoGrid';
import { DownloadProgressModal } from '../components/DownloadProgressModal';

// Hooks
import { useAlbumData } from '../hooks/useAlbumData';
import { usePhotoSelection } from '../hooks/usePhotoSelection';
import { useWorldGrouping } from '../hooks/useWorldGrouping';
import { usePhotoActions } from '../hooks/usePhotoActions';
import { useAlbumActions } from '../hooks/useAlbumActions';
import { useViewedAlbums } from '../hooks/useViewedAlbums';

export const AlbumViewPage = () => {
  const { custom_id } = useParams<{ custom_id: string }>();
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // カスタムフック
  const { album, photos, loading, error, setAlbum, setPhotos } = useAlbumData(custom_id, sortOrder);
  const { addToViewedAlbums, removeFromViewedAlbums } = useViewedAlbums();
  const {
    selectedPhotos,
    setSelectedPhotos,
    handleSelectionChange,
    allSelected,
    isIndeterminate,
    handleSelectAllChange
  } = usePhotoSelection(photos);
  const worldGroups = useWorldGrouping(photos);
  const { 
    isZipping, 
    downloadProgress, 
    handleDelete, 
    handleIndividualDownload, 
    handleBulkDownload, 
    cancelDownload 
  } = usePhotoActions(
    photos,
    setPhotos,
    album,
    setSelectedPhotos
  );
  const {
    editName,
    setEditName,
    editModalOpened,
    setEditModalOpened,
    startEditName,
    saveEditName,
    handleDeleteAlbum
  } = useAlbumActions(album, setAlbum, navigate, removeFromViewedAlbums);

  // アルバムが読み込まれた時に閲覧履歴に追加
  useEffect(() => {
    if (album) {
      addToViewedAlbums({
        custom_id: album.custom_id,
        name: album.name,
        viewedAt: new Date().toISOString()
      });
    }
  }, [album, addToViewedAlbums]);

  // イベントハンドラー
  const handlePhotoClick = (photo: Photo) => {
    setCurrentPhoto(photo);
    openModal();
  };

  const handlePhotoDelete = (photoId: number) => {
    handleDelete(photoId);
    if (currentPhoto?.id === photoId) closeModal();
  };

  const handleSortChange = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleUpload = () => {
    navigate(`/album/${custom_id}/upload`);
  };

  const handleBulkDownloadClick = () => {
    handleBulkDownload(selectedPhotos);
  };

  // ローディング・エラー状態
  if (loading) {
    return <Container my="md">{/* Skeleton loader */}</Container>;
  }

  if (error) {
    return (
      <Container my="md">
        <Center>
          <Text color="red" size="xl">{error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <>
      {/* モーダル */}
      <PhotoModal
        photo={currentPhoto}
        opened={modalOpened}
        onClose={closeModal}
        onDelete={handlePhotoDelete}
        onDownload={handleIndividualDownload}
      />

      <AlbumEditModal
        opened={editModalOpened}
        editName={editName}
        onClose={() => setEditModalOpened(false)}
        onSave={saveEditName}
        onEditNameChange={setEditName}
      />

      <DownloadProgressModal
        opened={downloadProgress.isActive}
        progress={downloadProgress}
        onCancel={cancelDownload}
      />

      {/* メインコンテンツ */}
      <Container my="md" pos="relative">
        {/* 詳細進捗モーダルがある場合は基本的なロードingオーバーレイは非表示 */}
        <LoadingOverlay 
          visible={isZipping && !downloadProgress.isActive} 
          overlayProps={{ radius: "sm", blur: 2 }} 
        />

        <AlbumHeader
          album={album}
          photosCount={photos.length}
          allSelected={allSelected}
          isIndeterminate={isIndeterminate}
          sortOrder={sortOrder}
          selectedPhotosCount={selectedPhotos.length}
          isZipping={isZipping}
          onEditName={startEditName}
          onSortChange={handleSortChange}
          onUpload={handleUpload}
          onBulkDownload={handleBulkDownloadClick}
          onDeleteAlbum={handleDeleteAlbum}
          onSelectAllChange={handleSelectAllChange}
        />

        {photos.length === 0 && !loading ? (
          <Center>
            <Text>このアルバムは空です。写真をアップロードしてください。</Text>
          </Center>
        ) : (
          <PhotoGrid
            worldGroups={worldGroups}
            selectedPhotos={selectedPhotos}
            onPhotoClick={handlePhotoClick}
            onSelectionChange={handleSelectionChange}
            onDelete={handleDelete}
          />
        )}

        <Center mt="md">
          <Button onClick={handleUpload}>写真をアップロード</Button>
        </Center>
      </Container>
    </>
  );
};

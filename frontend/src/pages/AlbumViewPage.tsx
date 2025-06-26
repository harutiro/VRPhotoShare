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
  
  // 実際の表示順序に合わせたフラットな写真配列を作成
  const displayOrderPhotos = Object.entries(worldGroups).flatMap(([, groupPhotos]) => groupPhotos);
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

  // ナビゲーション機能（実際の表示順序に基づく）
  const getCurrentPhotoIndex = () => {
    if (!currentPhoto || !displayOrderPhotos.length) return 0;
    return displayOrderPhotos.findIndex(photo => photo.id === currentPhoto.id);
  };

  const handleNextPhoto = () => {
    const currentIndex = getCurrentPhotoIndex();
    if (currentIndex < displayOrderPhotos.length - 1) {
      setCurrentPhoto(displayOrderPhotos[currentIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    const currentIndex = getCurrentPhotoIndex();
    if (currentIndex > 0) {
      setCurrentPhoto(displayOrderPhotos[currentIndex - 1]);
    }
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
        photos={displayOrderPhotos}
        currentPhotoIndex={getCurrentPhotoIndex()}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
      />

      <AlbumEditModal
        opened={editModalOpened}
        editName={editName}
        onClose={() => setEditModalOpened(false)}
        onSave={saveEditName}
        onEditNameChange={setEditName}
      />

      {/* HTMLベース進捗表示モーダル */}
      {downloadProgress.isActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            minWidth: '450px',
            maxWidth: '600px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: 'black'
          }}>
            {/* タイトル */}
            <h2 style={{ 
              margin: '0 0 25px 0', 
              textAlign: 'center',
              color: '#333',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              一括ダウンロード進行中
            </h2>

            {/* 現在のステップバッジ */}
            <div style={{
              textAlign: 'center',
              marginBottom: '25px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: downloadProgress.currentStep === 'downloading' ? '#3b82f6' :
                                downloadProgress.currentStep === 'zipping' ? '#f59e0b' :
                                downloadProgress.currentStep === 'saving' ? '#8b5cf6' : '#10b981',
                color: 'white'
              }}>
                {downloadProgress.currentStep === 'downloading' && '📥 写真をダウンロード中'}
                {downloadProgress.currentStep === 'zipping' && '📦 ZIPファイルを作成中'}
                {downloadProgress.currentStep === 'saving' && '💾 ファイルを保存中'}
                {downloadProgress.currentStep === 'completed' && '✅ ダウンロード完了！'}
              </span>
            </div>

            {/* 全体進捗 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span>全体の進捗</span>
                <span style={{ fontWeight: '600' }}>{downloadProgress.overallProgress}%</span>
              </div>
              <div style={{
                background: '#e5e7eb',
                height: '12px',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: downloadProgress.currentStep === 'downloading' ? '#3b82f6' :
                            downloadProgress.currentStep === 'zipping' ? '#f59e0b' :
                            downloadProgress.currentStep === 'saving' ? '#8b5cf6' : '#10b981',
                  height: '100%',
                  width: `${downloadProgress.overallProgress}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '6px'
                }}></div>
              </div>
            </div>

            {/* 写真ダウンロード詳細 */}
            {downloadProgress.currentStep === 'downloading' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <span>写真ダウンロード</span>
                  <span>{downloadProgress.completedPhotos} / {downloadProgress.totalPhotos}</span>
                </div>
                <div style={{
                  background: '#e5e7eb',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#3b82f6',
                    height: '100%',
                    width: `${(downloadProgress.completedPhotos / downloadProgress.totalPhotos) * 100}%`,
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            )}

            {/* ZIP圧縮詳細 */}
            {downloadProgress.currentStep === 'zipping' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <span>ZIP圧縮進捗</span>
                  <span>{downloadProgress.zipProgress}%</span>
                </div>
                <div style={{
                  background: '#e5e7eb',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#f59e0b',
                    height: '100%',
                    width: `${downloadProgress.zipProgress}%`,
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            )}

            {/* 現在のファイル名 */}
            {downloadProgress.currentPhotoName && (
              <div style={{
                textAlign: 'center',
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '20px',
                wordBreak: 'break-all',
                lineHeight: '1.4'
              }}>
                {downloadProgress.currentPhotoName}
              </div>
            )}

            {/* キャンセルボタン */}
            {downloadProgress.canCancel && downloadProgress.currentStep !== 'completed' && (
              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={cancelDownload}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#b91c1c'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
                >
                  ❌ キャンセル
                </button>
              </div>
            )}

            {/* 完了メッセージ */}
            {downloadProgress.currentStep === 'completed' && (
              <div style={{
                textAlign: 'center',
                color: '#10b981',
                fontWeight: '500',
                fontSize: '14px'
              }}>
                {downloadProgress.totalPhotos}枚の写真のダウンロードが完了しました！
              </div>
            )}
          </div>
        </div>
              )}

      {/* メインコンテンツ */}
      <Container my="md" pos="relative">
        {/* 詳細進捗モーダルがある場合は基本的なLoadingOverlayは非表示 */}
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

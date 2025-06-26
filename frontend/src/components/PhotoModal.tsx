import { Modal, Stack, Group, Button, ActionIcon } from '@mantine/core';
import { useClipboard, useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconTrash, IconLink, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { Photo } from '../types/photo';

interface PhotoModalProps {
  photo: Photo | null;
  opened: boolean;
  onClose: () => void;
  onDelete: (photoId: number) => void;
  onDownload: (photo: Photo) => void;
  // ナビゲーション用の追加プロパティ
  photos: Photo[];
  currentPhotoIndex: number;
  onNext?: () => void;
  onPrev?: () => void;
}

export const PhotoModal = ({ 
  photo, 
  opened, 
  onClose, 
  onDelete, 
  onDownload,
  photos,
  currentPhotoIndex,
  onNext,
  onPrev
}: PhotoModalProps) => {
  const clipboard = useClipboard({ timeout: 500 });

  // キーボードショートカット
  useHotkeys([
    ['ArrowLeft', () => onPrev && canGoPrev && onPrev()],
    ['ArrowRight', () => onNext && canGoNext && onNext()],
    ['Escape', onClose],
  ]);

  if (!photo) return null;

  const canGoPrev = currentPhotoIndex > 0;
  const canGoNext = currentPhotoIndex < photos.length - 1;

  const handleCopyLink = () => {
    const shareUrl = photo.thumbnailUrl || photo.url;
    clipboard.copy(shareUrl);
    notifications.show({
      title: 'リンクをコピーしました',
      message: 'サムネイル画像の直リンクをクリップボードにコピーしました。',
      color: 'green',
    });
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <span>{photo.name}</span>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {currentPhotoIndex + 1} / {photos.length}
          </span>
        </Group>
      }
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
      <Stack>
        {/* 画像表示エリア */}
        <div style={{ position: 'relative' }}>
          <img
            src={photo.url}
            alt={photo.name}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              display: 'block',
              margin: 'auto'
            }}
          />
          
          {/* 左ナビゲーションボタン */}
          {canGoPrev && onPrev && (
            <ActionIcon
              size="lg"
              variant="filled"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                zIndex: 1
              }}
              onClick={onPrev}
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
          )}
          
          {/* 右ナビゲーションボタン */}
          {canGoNext && onNext && (
            <ActionIcon
              size="lg"
              variant="filled"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                zIndex: 1
              }}
              onClick={onNext}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          )}
        </div>

        {/* ナビゲーション情報と操作ボタン */}
        <Group justify="space-between">
          {/* 左側：ナビゲーション情報 */}
          <Group>
            <Button 
              variant="subtle" 
              size="sm"
              leftSection={<IconChevronLeft size={14} />}
              onClick={onPrev}
              disabled={!canGoPrev}
              style={{ opacity: canGoPrev ? 1 : 0.3 }}
            >
              前の写真
            </Button>
            <Button 
              variant="subtle" 
              size="sm"
              rightSection={<IconChevronRight size={14} />}
              onClick={onNext}
              disabled={!canGoNext}
              style={{ opacity: canGoNext ? 1 : 0.3 }}
            >
              次の写真
            </Button>
          </Group>

          {/* 右側：操作ボタン */}
          <Group>
            <Button 
              leftSection={<IconLink size={14} />} 
              variant="light"
              onClick={handleCopyLink}
            >
              imagePad用リンクをコピー
            </Button>
            <Button 
              leftSection={<IconDownload size={14} />} 
              onClick={() => onDownload(photo)}
            >
              Download
            </Button>
            <Button 
              color="red" 
              leftSection={<IconTrash size={14} />} 
              onClick={() => onDelete(photo.id)}
            >
              Delete
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}; 
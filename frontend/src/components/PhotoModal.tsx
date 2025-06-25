import { Modal, Stack, Group, Button } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconTrash, IconLink } from '@tabler/icons-react';
import type { Photo } from '../types/photo';

interface PhotoModalProps {
  photo: Photo | null;
  opened: boolean;
  onClose: () => void;
  onDelete: (photoId: number) => void;
  onDownload: (photo: Photo) => void;
}

export const PhotoModal = ({ photo, opened, onClose, onDelete, onDownload }: PhotoModalProps) => {
  const clipboard = useClipboard({ timeout: 500 });

  if (!photo) return null;

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
      title={photo.name} 
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
        <Group justify="flex-end" mt="md">
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
      </Stack>
    </Modal>
  );
}; 
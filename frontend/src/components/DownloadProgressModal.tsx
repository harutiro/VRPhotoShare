import { Modal, Progress, Text, Group, Button, Stack, Badge, Center } from '@mantine/core';
import { IconDownload, IconX, IconFileZip, IconDeviceFloppy, IconCheck } from '@tabler/icons-react';
import type { DownloadProgress } from '../hooks/usePhotoActions';

interface DownloadProgressModalProps {
  opened: boolean;
  progress: DownloadProgress;
  onCancel: () => void;
}

export const DownloadProgressModal = ({ opened, progress, onCancel }: DownloadProgressModalProps) => {
  const getStepIcon = () => {
    switch (progress.currentStep) {
      case 'downloading':
        return <IconDownload size={20} />;
      case 'zipping':
        return <IconFileZip size={20} />;
      case 'saving':
        return <IconDeviceFloppy size={20} />;
      case 'completed':
        return <IconCheck size={20} />;
      default:
        return <IconDownload size={20} />;
    }
  };

  const getStepText = () => {
    switch (progress.currentStep) {
      case 'downloading':
        return '写真をダウンロード中';
      case 'zipping':
        return 'ZIPファイルを作成中';
      case 'saving':
        return 'ファイルを保存中';
      case 'completed':
        return 'ダウンロード完了！';
      default:
        return '処理中';
    }
  };

  const getStepColor = () => {
    switch (progress.currentStep) {
      case 'downloading':
        return 'blue';
      case 'zipping':
        return 'orange';
      case 'saving':
        return 'grape';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}} // 進捗中は閉じられないように
      title="一括ダウンロード進行中"
      size="md"
      centered
      closeButtonProps={{ 
        style: { display: progress.currentStep === 'completed' ? 'block' : 'none' } 
      }}
    >
      <Stack gap="lg">
        {/* 現在のステップ表示 */}
        <Group justify="center">
          <Badge 
            color={getStepColor()} 
            size="lg" 
            leftSection={getStepIcon()}
            variant="filled"
          >
            {getStepText()}
          </Badge>
        </Group>

        {/* 全体の進捗バー */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>全体の進捗</Text>
            <Text size="sm" c="dimmed">{progress.overallProgress}%</Text>
          </Group>
          <Progress 
            value={progress.overallProgress} 
            size="lg" 
            radius="md" 
            color={getStepColor()}
            animated={progress.currentStep !== 'completed'}
          />
        </Stack>

        {/* 写真ダウンロード詳細 */}
        {progress.currentStep === 'downloading' && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>写真ダウンロード</Text>
              <Text size="sm" c="dimmed">
                {progress.completedPhotos} / {progress.totalPhotos}
              </Text>
            </Group>
            <Progress 
              value={(progress.completedPhotos / progress.totalPhotos) * 100} 
              size="md" 
              radius="md" 
              color="blue"
            />
          </Stack>
        )}

        {/* 現在処理中のファイル名 */}
        {progress.currentPhotoName && (
          <Center>
            <Text size="sm" c="dimmed" ta="center" style={{ wordBreak: 'break-all' }}>
              {progress.currentPhotoName}
            </Text>
          </Center>
        )}

        {/* キャンセルボタン */}
        {progress.canCancel && progress.currentStep !== 'completed' && (
          <Group justify="center">
            <Button
              variant="outline"
              color="red"
              leftSection={<IconX size={16} />}
              onClick={onCancel}
            >
              キャンセル
            </Button>
          </Group>
        )}

        {/* 完了時のメッセージ */}
        {progress.currentStep === 'completed' && (
          <Center>
            <Text size="sm" c="green" fw={500}>
              {progress.totalPhotos}枚の写真のダウンロードが完了しました！
            </Text>
          </Center>
        )}
      </Stack>
    </Modal>
  );
}; 
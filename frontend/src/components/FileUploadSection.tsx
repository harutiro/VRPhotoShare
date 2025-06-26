import { Title, Text, Group, Button, SimpleGrid, Image, Switch, Stack } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import type { FileWithPath, BatchUploadState } from '../types/upload';
import { BatchUploadProgress } from './BatchUploadProgress';

interface FileUploadSectionProps {
  customId?: string;
  // 従来の一括アップロード用
  files: FileWithPath[];
  uploading: boolean;
  onFilesSelect: (files: FileWithPath[]) => void;
  onFilesReject: () => void;
  onUpload: () => void;
  onClearSelection: () => void;
  // 新しいバッチアップロード用
  batchUploadState?: BatchUploadState;
  onBatchFilesSelect?: (files: FileWithPath[]) => void;
  onBatchUploadStart?: () => void;
  onBatchRetryFile?: (fileId: string) => Promise<void>;
  onBatchRemoveFile?: (fileId: string) => void;
  onBatchClearFiles?: () => void;
}

export const FileUploadSection = ({
  customId,
  files,
  uploading,
  onFilesSelect,
  onFilesReject,
  onUpload,
  onClearSelection,
  batchUploadState,
  onBatchFilesSelect,
  onBatchUploadStart,
  onBatchRetryFile,
  onBatchRemoveFile,
  onBatchClearFiles
}: FileUploadSectionProps) => {
  const [useBatchUpload, setUseBatchUpload] = useState(true);
  
  const currentFiles = useBatchUpload 
    ? batchUploadState?.files.map(item => item.file) || []
    : files;
  
  const isUploading = useBatchUpload 
    ? batchUploadState?.isUploading || false
    : uploading;

  const handleFilesSelect = (newFiles: FileWithPath[]) => {
    if (useBatchUpload && onBatchFilesSelect) {
      onBatchFilesSelect(newFiles);
    } else {
      onFilesSelect(newFiles);
    }
  };

  const handleUpload = () => {
    if (useBatchUpload && onBatchUploadStart) {
      onBatchUploadStart();
    } else {
      onUpload();
    }
  };

  const handleClearSelection = () => {
    if (useBatchUpload && onBatchClearFiles) {
      onBatchClearFiles();
    } else {
      onClearSelection();
    }
  };

  const previews = currentFiles.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return (
      <Image 
        key={index} 
        src={imageUrl} 
        onLoad={() => URL.revokeObjectURL(imageUrl)} 
        radius="md"
      />
    );
  });

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="lg">
          {customId ? 'アルバムに写真をアップロード' : '写真をアップロード'}
        </Title>
        
        <Text c="dimmed" mb="lg">
          {customId
            ? 'このアルバムに写真が追加されます。'
            : 'ここで写真をアップロードすると、ホームページに表示されます。'
          }
        </Text>

        {/* アップロード方式の選択 */}
        <Group mb="lg">
          <Switch
            checked={useBatchUpload}
            onChange={(event) => setUseBatchUpload(event.currentTarget.checked)}
            label={useBatchUpload ? "分割アップロード（推奨）" : "一括アップロード"}
            description={
              useBatchUpload 
                ? "ファイルを1つずつ送信します。100MB超過時も安全です。" 
                : "全ファイルを一度に送信します。合計100MB以下の場合のみ。"
            }
          />
        </Group>
      </div>
      
      <Dropzone
        onDrop={handleFilesSelect}
        onReject={() => {
          console.log('rejected files');
          onFilesReject();
        }}
        maxSize={10 * 1024 ** 2} // 10MB
        accept={IMAGE_MIME_TYPE}
        disabled={isUploading}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size="3.2rem" stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size="3.2rem" stroke={1.5} color="red" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto size="3.2rem" stroke={1.5} />
          </Dropzone.Idle>
          <div>
            <Text size="xl" inline>画像をここにドラッグまたはクリックして選択</Text>
            <Text size="sm" c="dimmed" inline mt={7}>複数ファイルOK、1ファイル10MBまで</Text>
          </div>
        </Group>
      </Dropzone>

      {/* バッチアップロードの進捗表示 */}
      {useBatchUpload && batchUploadState && onBatchRetryFile && onBatchRemoveFile && (
        <BatchUploadProgress
          uploadState={batchUploadState}
          onRetryFile={onBatchRetryFile}
          onRemoveFile={onBatchRemoveFile}
        />
      )}

      {/* 従来のプレビュー表示（一括アップロード時） */}
      {!useBatchUpload && currentFiles.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {previews}
        </SimpleGrid>
      )}

      {/* アップロードボタン */}
      {currentFiles.length > 0 && (
        <Group justify="flex-end">
          <Button 
            variant="default" 
            onClick={handleClearSelection} 
            disabled={isUploading}
          >
            選択をクリア
          </Button>
          <Button 
            onClick={handleUpload} 
            loading={isUploading}
            disabled={useBatchUpload && batchUploadState?.allCompleted}
          >
            {useBatchUpload ? '分割アップロード開始' : `${currentFiles.length}枚の写真をアップロード`}
          </Button>
        </Group>
      )}
    </Stack>
  );
}; 
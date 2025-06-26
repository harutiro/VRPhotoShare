import { Title, Text, Group, Button, SimpleGrid, Image, Switch, Stack, Badge, Box, Overlay, Center, Loader } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconCheck, IconClock, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import type { FileWithPath, BatchUploadState, FileUploadItem } from '../types/upload';

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

const getStatusIcon = (status: FileUploadItem['status']) => {
  switch (status) {
    case 'pending':
      return <IconClock size={20} color="gray" />;
    case 'uploading':
      return <Loader size={20} color="blue" />;
    case 'success':
      return <IconCheck size={20} color="green" />;
    case 'error':
      return <IconX size={20} color="red" />;
    default:
      return <IconClock size={20} color="gray" />;
  }
};

const getStatusColor = (status: FileUploadItem['status']) => {
  switch (status) {
    case 'pending':
      return 'gray';
    case 'uploading':
      return 'blue';
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusText = (status: FileUploadItem['status']) => {
  switch (status) {
    case 'pending':
      return '待機中';
    case 'uploading':
      return 'アップロード中';
    case 'success':
      return '完了';
    case 'error':
      return 'エラー';
    default:
      return '不明';
  }
};

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
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  
  const currentFiles = useBatchUpload 
    ? batchUploadState?.files.map(item => item.file) || []
    : files;
  
  const isUploading = useBatchUpload 
    ? batchUploadState?.isUploading || false
    : uploading;

  // ページ全体でのドラッグアンドドロップイベントを処理
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files) {
        const droppedFiles = Array.from(e.dataTransfer.files) as FileWithPath[];
        
        // ファイル形式をチェック
        const validFiles = droppedFiles.filter(file => 
          IMAGE_MIME_TYPE.includes(file.type)
        );
        
        if (validFiles.length > 0) {
          handleFilesSelect(validFiles);
        } else {
          onFilesReject();
        }
      }
    };

    // イベントリスナーを追加
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      // クリーンアップ
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [useBatchUpload, onBatchFilesSelect, onFilesSelect, onFilesReject]);

  const handleFilesSelect = (newFiles: FileWithPath[]) => {
    setIsDragging(false);
    dragCounterRef.current = 0;
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

  // バッチアップロード用のファイルアイテムを取得
  const getBatchFileItem = (file: FileWithPath): FileUploadItem | undefined => {
    return batchUploadState?.files.find(item => item.file === file);
  };

  const renderFilePreview = (file: FileWithPath, index: number) => {
    const imageUrl = URL.createObjectURL(file);
    const fileItem = useBatchUpload ? getBatchFileItem(file) : undefined;
    
    return (
      <Box key={useBatchUpload ? fileItem?.id || index : index} pos="relative">
        <Image 
          src={imageUrl} 
          onLoad={() => URL.revokeObjectURL(imageUrl)} 
          radius="md"
          h={200}
          style={{ objectFit: 'cover' }}
        />
        
        {/* バッチアップロード時のステータス表示 */}
        {useBatchUpload && fileItem && (
          <>
            {/* ステータスオーバーレイ */}
            {(fileItem.status === 'uploading' || fileItem.status === 'success' || fileItem.status === 'error') && (
              <Overlay color="#000" backgroundOpacity={0.6} radius="md">
                <Center h="100%">
                  <Stack align="center" gap="xs">
                    {getStatusIcon(fileItem.status)}
                    <Text size="sm" c="white" fw={500}>
                      {getStatusText(fileItem.status)}
                    </Text>
                    {fileItem.status === 'uploading' && (
                      <Text size="xs" c="white">
                        {fileItem.progress}%
                      </Text>
                    )}
                  </Stack>
                </Center>
              </Overlay>
            )}
            
            {/* ステータスバッジ */}
            <Badge 
              color={getStatusColor(fileItem.status)} 
              variant="filled"
              pos="absolute"
              top={8}
              left={8}
              size="sm"
            >
              {getStatusText(fileItem.status)}
            </Badge>
            
            {/* アクションボタン */}
            {fileItem.status === 'error' && onBatchRetryFile && fileItem.retryCount < 3 && (
              <Button
                size="xs"
                variant="filled"
                color="blue"
                pos="absolute"
                bottom={8}
                left={8}
                leftSection={<IconRefresh size={14} />}
                onClick={() => onBatchRetryFile(fileItem.id)}
              >
                再試行
              </Button>
            )}
            
            {(fileItem.status === 'pending' || fileItem.status === 'error') && onBatchRemoveFile && (
              <Button
                size="xs"
                variant="filled"
                color="red"
                pos="absolute"
                bottom={8}
                right={8}
                leftSection={<IconTrash size={14} />}
                onClick={() => onBatchRemoveFile(fileItem.id)}
              >
                削除
              </Button>
            )}
          </>
        )}
      </Box>
    );
  };

  const successCount = useBatchUpload ? batchUploadState?.files.filter(f => f.status === 'success').length || 0 : 0;
  const errorCount = useBatchUpload ? batchUploadState?.files.filter(f => f.status === 'error').length || 0 : 0;
  const totalFiles = currentFiles.length;

  return (
    <Box pos="relative">
      {/* ドラッグ中の背景暗転オーバーレイ */}
      {isDragging && (
        <Overlay 
          color="#000" 
          backgroundOpacity={0.3} 
          pos="fixed"
          style={{ 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh',
            zIndex: 999,
            pointerEvents: 'none'
          }}
        >
          <Center h="100vh">
            <Stack align="center" gap="lg">
              <IconUpload size="4rem" color="white" stroke={1.5} />
              <Text size="xl" c="white" fw={600}>
                ここにファイルをドロップしてください
              </Text>
              <Text size="md" c="white" opacity={0.8}>
                画面のどこにでもドロップできます
              </Text>
            </Stack>
          </Center>
        </Overlay>
      )}

      <Stack gap="lg">
        <div>
          <Title order={2} mb="lg">
            {customId ? 'アルバムに写真をアップロード' : '写真をアップロード'}
          </Title>
          
          <Text c="dimmed" mb="lg">
            {customId
              ? 'このアルバムに写真が追加されます。画面のどこにでもファイルをドラッグしてアップロードできます。'
              : 'ここで写真をアップロードすると、ホームページに表示されます。画面のどこにでもファイルをドラッグしてアップロードできます。'
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
          styles={{
            root: {
              border: '2px dashed #dee2e6',
              borderRadius: '12px',
              backgroundColor: '#f8f9fa',
              transition: 'all 0.2s ease',
              '&[data-accept]': {
                border: '2px dashed #228be6',
                backgroundColor: '#e7f5ff',
              },
              '&[data-reject]': {
                border: '2px dashed #fa5252',
                backgroundColor: '#ffe0e0',
              },
              '&:hover': {
                backgroundColor: '#f1f3f4',
                border: '2px dashed #495057',
              }
            }
          }}
        >
          <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <Box ta="center">
                <IconUpload size="3.2rem" stroke={1.5} color="#228be6" />
                <Text size="xl" inline mt="md" c="blue">
                  ファイルをドロップしてアップロード
                </Text>
                <Text size="sm" c="dimmed" inline mt={7} display="block">
                  複数ファイルOK、1ファイル10MBまで
                </Text>
              </Box>
            </Dropzone.Accept>
            <Dropzone.Reject>
              <Box ta="center">
                <IconX size="3.2rem" stroke={1.5} color="#fa5252" />
                <Text size="xl" inline mt="md" c="red">
                  このファイル形式はサポートされていません
                </Text>
                <Text size="sm" c="dimmed" inline mt={7} display="block">
                  画像ファイルのみアップロード可能です
                </Text>
              </Box>
            </Dropzone.Reject>
            <Dropzone.Idle>
              <Box ta="center">
                <IconPhoto size="3.2rem" stroke={1.5} color="#868e96" />
                <Text size="xl" inline mt="md">
                  画像をここにドラッグまたはクリックして選択
                </Text>
                <Text size="sm" c="dimmed" inline mt={7} display="block">
                  複数ファイルOK、1ファイル10MBまで
                </Text>
                <Text size="xs" c="dimmed" inline mt={2} display="block">
                  💡 画面のどこにでもファイルをドラッグできます
                </Text>
              </Box>
            </Dropzone.Idle>
          </Group>
        </Dropzone>

        {/* アップロードボタンとコントロール（上部に配置） */}
        {currentFiles.length > 0 && (
          <Stack gap="md">
            {/* 進捗表示（バッチアップロード時） */}
            {useBatchUpload && totalFiles > 0 && (
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  進捗: {successCount + errorCount} / {totalFiles} ファイル
                </Text>
                <Group gap="sm">
                  {successCount > 0 && (
                    <Badge color="green" variant="light">
                      成功: {successCount}
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge color="red" variant="light">
                      エラー: {errorCount}
                    </Badge>
                  )}
                </Group>
              </Group>
            )}
            
            {/* アップロードボタン */}
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
                size="lg"
              >
                {useBatchUpload ? '分割アップロード開始' : `${currentFiles.length}枚の写真をアップロード`}
              </Button>
            </Group>
          </Stack>
        )}

        {/* 写真のグリッド表示 */}
        {currentFiles.length > 0 && (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {currentFiles.map((file, index) => renderFilePreview(file, index))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}; 
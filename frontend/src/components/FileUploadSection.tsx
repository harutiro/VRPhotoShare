import { Title, Text, Group, Button, SimpleGrid, Image, Stack, Badge, Box, Overlay, Center, Loader, Progress } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconCheck, IconClock, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import type { FileWithPath, BatchUploadState, FileUploadItem } from '../types/upload';

interface FileUploadSectionProps {
  customId?: string;
  // バッチアップロード用（分割アップロードのみ）
  batchUploadState: BatchUploadState;
  onBatchFilesSelect: (files: FileWithPath[]) => void;
  onBatchUploadStart: () => void;
  onBatchRetryFile: (fileId: string) => Promise<void>;
  onBatchRemoveFile: (fileId: string) => void;
  onBatchClearFiles: () => void;
  onFilesReject: () => void;
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
  batchUploadState,
  onBatchFilesSelect,
  onBatchUploadStart,
  onBatchRetryFile,
  onBatchRemoveFile,
  onBatchClearFiles,
  onFilesReject
}: FileUploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  
  const currentFiles = batchUploadState.files.map(item => item.file);
  const isUploading = batchUploadState.isUploading;

  // 全体の進捗を計算する関数
  const calculateOverallProgress = (): { percentage: number; completedFiles: number; totalFiles: number } => {
    const totalFiles = batchUploadState.files.length;
    if (totalFiles === 0) return { percentage: 0, completedFiles: 0, totalFiles: 0 };

    // 各ファイルの進捗を合計して平均を出す
    const totalProgress = batchUploadState.files.reduce((sum, file) => {
      if (file.status === 'success') return sum + 100;
      if (file.status === 'error') return sum + 100; // エラーも完了として扱う
      if (file.status === 'uploading') return sum + file.progress;
      return sum; // pending は 0
    }, 0);

    const completedFiles = batchUploadState.files.filter(
      f => f.status === 'success' || f.status === 'error'
    ).length;

    const percentage = Math.round(totalProgress / totalFiles);
    
    return { percentage, completedFiles, totalFiles };
  };

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
  }, [onBatchFilesSelect, onFilesReject]);

  const handleFilesSelect = (newFiles: FileWithPath[]) => {
    setIsDragging(false);
    dragCounterRef.current = 0;
    onBatchFilesSelect(newFiles);
  };

  // バッチアップロード用のファイルアイテムを取得
  const getBatchFileItem = (file: FileWithPath): FileUploadItem | undefined => {
    return batchUploadState.files.find(item => item.file === file);
  };

  const renderFilePreview = (file: FileWithPath, index: number) => {
    const imageUrl = URL.createObjectURL(file);
    const fileItem = getBatchFileItem(file);
    
    return (
      <Box key={fileItem?.id || index} pos="relative">
        <Image 
          src={imageUrl} 
          onLoad={() => URL.revokeObjectURL(imageUrl)} 
          radius="md"
          h={200}
          style={{ objectFit: 'cover' }}
        />
        
        {/* ステータス表示 */}
        {fileItem && (
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
            {fileItem.status === 'error' && fileItem.retryCount < 3 && (
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
            
            {(fileItem.status === 'pending' || fileItem.status === 'error') && (
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

  const successCount = batchUploadState.files.filter(f => f.status === 'success').length;
  const errorCount = batchUploadState.files.filter(f => f.status === 'error').length;
  const { percentage: overallPercentage, completedFiles, totalFiles } = calculateOverallProgress();

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
              ? 'このアルバムに写真が追加されます。ファイルは1つずつ安全にアップロードされ、100MB超過時のエラーを防ぎます。画面のどこにでもファイルをドラッグしてアップロードできます。'
              : 'ここで写真をアップロードすると、ホームページに表示されます。ファイルは1つずつ安全にアップロードされ、100MB超過時のエラーを防ぎます。画面のどこにでもファイルをドラッグしてアップロードできます。'
            }
          </Text>

          {/* 分割アップロードの説明 */}
          <Badge color="blue" variant="light" size="lg" mb="lg">
            🔒 安全な分割アップロード方式
          </Badge>
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
                  ファイルをドロップして分割アップロード
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
                  複数ファイルOK、1ファイル10MBまで（分割アップロード）
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
            {/* 全体進捗表示 */}
            {totalFiles > 0 && (
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="lg" fw={600}>
                    全体の進捗: {overallPercentage}%
                  </Text>
                  <Text size="sm" c="dimmed">
                    {completedFiles} / {totalFiles} ファイル完了
                  </Text>
                </Group>
                <Progress 
                  value={overallPercentage} 
                  size="xl" 
                  radius="md"
                  color={overallPercentage === 100 ? 'green' : 'blue'}
                  striped={isUploading}
                  animated={isUploading}
                />
              </Box>
            )}

            {/* 詳細統計 */}
            {totalFiles > 0 && (
              <Group justify="center" gap="lg">
                {successCount > 0 && (
                  <Badge color="green" variant="light" size="md">
                    ✅ 成功: {successCount}
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge color="red" variant="light" size="md">
                    ❌ エラー: {errorCount}
                  </Badge>
                )}
                {(totalFiles - completedFiles) > 0 && (
                  <Badge color="gray" variant="light" size="md">
                    ⏳ 残り: {totalFiles - completedFiles}
                  </Badge>
                )}
              </Group>
            )}
            
            {/* アップロードボタン */}
            <Group justify="flex-end">
              <Button 
                variant="default" 
                onClick={onBatchClearFiles} 
                disabled={isUploading}
              >
                選択をクリア
              </Button>
              <Button 
                onClick={onBatchUploadStart} 
                loading={isUploading}
                disabled={batchUploadState.allCompleted}
                size="lg"
              >
                分割アップロード開始
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
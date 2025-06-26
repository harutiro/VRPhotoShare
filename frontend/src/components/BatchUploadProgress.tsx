import React from 'react';
import { Box, Group, Text, Progress, Button, Card, Stack, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconLoader, IconClock, IconRefresh, IconTrash } from '@tabler/icons-react';
import type { FileUploadItem, BatchUploadState } from '../types/upload';

interface BatchUploadProgressProps {
  uploadState: BatchUploadState;
  onRetryFile: (fileId: string) => Promise<void>;
  onRemoveFile: (fileId: string) => void;
}

const getStatusIcon = (status: FileUploadItem['status'], isRetrying?: boolean) => {
  if (isRetrying) return <IconLoader size={16} className="animate-spin" />;
  
  switch (status) {
    case 'pending':
      return <IconClock size={16} color="gray" />;
    case 'uploading':
      return <IconLoader size={16} className="animate-spin" color="blue" />;
    case 'success':
      return <IconCheck size={16} color="green" />;
    case 'error':
      return <IconX size={16} color="red" />;
    default:
      return <IconClock size={16} color="gray" />;
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const BatchUploadProgress: React.FC<BatchUploadProgressProps> = ({
  uploadState,
  onRetryFile,
  onRemoveFile
}) => {
  const { files, totalFiles, completedFiles } = uploadState;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  if (files.length === 0) {
    return null;
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        {/* 全体の進捗 */}
        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              全体の進捗
            </Text>
            <Text size="sm" c="dimmed">
              {completedFiles} / {totalFiles} ファイル
            </Text>
          </Group>
          <Progress value={overallProgress} size="lg" radius="md" />
          
          {completedFiles > 0 && (
            <Group justify="center" mt="xs" gap="lg">
              <Badge color="green" variant="light">
                成功: {successCount}
              </Badge>
              {errorCount > 0 && (
                <Badge color="red" variant="light">
                  エラー: {errorCount}
                </Badge>
              )}
            </Group>
          )}
        </Box>

        {/* 個別ファイルの進捗 */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>ファイル別進捗</Text>
          {files.map((fileItem) => (
            <Card key={fileItem.id} withBorder radius="sm" p="sm">
              <Group justify="space-between" align="flex-start">
                <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  {getStatusIcon(fileItem.status)}
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                      {fileItem.file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatFileSize(fileItem.file.size)}
                    </Text>
                    {fileItem.error && (
                      <Text size="xs" c="red" mt={2}>
                        {fileItem.error}
                      </Text>
                    )}
                  </Box>
                </Group>

                <Group gap="xs" align="center">
                  <Badge 
                    color={getStatusColor(fileItem.status)} 
                    variant="light" 
                    size="sm"
                  >
                    {getStatusText(fileItem.status)}
                  </Badge>
                  
                  {fileItem.status === 'error' && fileItem.retryCount < 3 && (
                    <Tooltip label="再試行">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => onRetryFile(fileItem.id)}
                      >
                        <IconRefresh size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  
                  {(fileItem.status === 'pending' || fileItem.status === 'error') && (
                    <Tooltip label="削除">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => onRemoveFile(fileItem.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>

              {/* プログレスバー */}
              {fileItem.status === 'uploading' && (
                <Progress
                  value={fileItem.progress}
                  size="xs"
                  radius="md"
                  mt="xs"
                  color="blue"
                />
              )}
              
              {fileItem.retryCount > 0 && (
                <Text size="xs" c="dimmed" mt="xs">
                  再試行回数: {fileItem.retryCount}/3
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}; 
import { Title, Text, Group, Button, SimpleGrid, Image } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import type { FileWithPath } from '../types/upload';

interface FileUploadSectionProps {
  customId?: string;
  files: FileWithPath[];
  uploading: boolean;
  onFilesSelect: (files: FileWithPath[]) => void;
  onFilesReject: () => void;
  onUpload: () => void;
  onClearSelection: () => void;
}

export const FileUploadSection = ({
  customId,
  files,
  uploading,
  onFilesSelect,
  onFilesReject,
  onUpload,
  onClearSelection
}: FileUploadSectionProps) => {
  const previews = files.map((file, index) => {
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
    <>
      <Title order={2} mb="lg">
        {customId ? 'アルバムに写真をアップロード' : '写真をアップロード'}
      </Title>
      
      <Text c="dimmed" mb="lg">
        {customId
          ? 'このアルバムに写真が追加されます。'
          : 'ここで写真をアップロードすると、ホームページに表示されます。'
        }
      </Text>
      
      <Dropzone
        onDrop={onFilesSelect}
        onReject={() => {
          console.log('rejected files');
          onFilesReject();
        }}
        maxSize={10 * 1024 ** 2} // 10MB
        accept={IMAGE_MIME_TYPE}
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

      {files.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mt="xl">
            {previews}
          </SimpleGrid>

          <Group justify="flex-end" mt="xl">
            <Button 
              variant="default" 
              onClick={onClearSelection} 
              disabled={uploading}
            >
              選択をクリア
            </Button>
            <Button onClick={onUpload} loading={uploading}>
              {files.length}枚の写真をアップロード
            </Button>
          </Group>
        </>
      )}
    </>
  );
}; 
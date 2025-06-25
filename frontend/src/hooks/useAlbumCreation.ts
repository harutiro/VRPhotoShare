import { useState } from 'react';
import { notifications } from '@mantine/notifications';

export const useAlbumCreation = (onSuccess?: (customId: string) => void) => {
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInput = (): boolean => {
    if (!name.trim() || !customId.trim()) {
      notifications.show({
        title: '入力エラー',
        message: 'アルバム名とアルバムIDは必須です。',
        color: 'red',
      });
      return false;
    }
    return true;
  };

  const createAlbum = async (): Promise<void> => {
    if (!validateInput()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, custom_id: customId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create album.');
      }

      notifications.show({
        title: '作成成功',
        message: `アルバム「${name}」を作成しました。`,
        color: 'green',
      });

      if (onSuccess) {
        onSuccess(customId);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'アルバムの作成に失敗しました。';
      notifications.show({
        title: '作成失敗',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    customId,
    setCustomId,
    loading,
    createAlbum
  };
}; 
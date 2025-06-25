import { Alert, Text, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export const AlphaBanner = () => {
  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      title="⚠️ アルファ版のご注意"
      color="orange"
      variant="light"
    >
      <Text size="sm">
        このシステムは<strong>アルファ版</strong>です。以下の点にご注意ください：
      </Text>
      <Stack gap="xs" mt="xs">
        <Text size="sm">• <strong>データ消失の可能性</strong>：予告なくアップロードした写真やアルバムが削除される場合があります</Text>
        <Text size="sm">• <strong>セキュリティレベル</strong>：本格運用レベルのセキュリティ対策は実装されていません</Text>
        <Text size="sm">• <strong>機能制限</strong>：予期しない動作やエラーが発生する可能性があります</Text>
        <Text size="sm">重要な写真は必ずバックアップを取ってからご利用ください。</Text>
      </Stack>
    </Alert>
  );
}; 
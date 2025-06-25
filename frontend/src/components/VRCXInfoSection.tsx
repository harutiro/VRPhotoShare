import { Card, Title, Stack, Text } from '@mantine/core';

export const VRCXInfoSection = () => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="sm">💡 VRCXユーザーの方へ</Title>
      <Stack gap="xs">
        <Text>
          <b>VRCX</b>を使用してスクリーンショットを撮影すると、PNGファイルに自動的にメタデータが追加されます。
        </Text>
        <Text>
          このメタデータには<b>ワールド情報</b>（ワールド名など）が含まれており、
          アップロード時に自動的に読み取られて写真がワールドごとにグループ分けされます。
        </Text>
        <Text c="dimmed" size="sm">
          ※ VRCXを使用していない場合でも、近い時刻に撮影された他の写真のワールド情報を参考にグループ分けが行われます。
        </Text>
      </Stack>
    </Card>
  );
}; 
import { Card, Title, Stack, Text } from '@mantine/core';

export const InstructionsSection = () => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="sm">使い方</Title>
      <Stack gap="xs">
        <Text>1. <b>アルバム作成</b>: 「アルバム作成」ボタンをクリックし、名前とIDを決めてください。</Text>
        <Text>2. <b>写真をアップロード</b>: アルバム作成後、写真をアップロードできます。複数ファイルもOK！</Text>
        <Text>3. <b>共有</b>: アルバムIDを友達に教えて、このページでIDを入力してもらいましょう。</Text>
      </Stack>
    </Card>
  );
}; 
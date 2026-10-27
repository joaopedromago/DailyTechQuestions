import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type ComingSoonScreenProps = {
  message: string;
  title: string;
};

export function ComingSoonScreen({ message, title }: ComingSoonScreenProps) {
  return (
    <SafeAreaView className="flex-1">
      <Box className="flex-1 justify-center bg-background px-6 py-8">
        <Box className="mx-auto w-full max-w-xl gap-6">
          <Box className="gap-2">
            <Text role="heading" className="text-2xl font-bold text-foreground">
              {title}
            </Text>
            <Text className="text-base text-muted-foreground">{message}</Text>
          </Box>
          <Button
            accessibilityLabel="Back to menu"
            className="self-start"
            variant="outline"
            onPress={() => router.replace('/')}
          >
            <ButtonText>Back to menu</ButtonText>
          </Button>
        </Box>
      </Box>
    </SafeAreaView>
  );
}

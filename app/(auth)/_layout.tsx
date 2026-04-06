import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#000' } }} />
  );
}
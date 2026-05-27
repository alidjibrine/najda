import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/constants/theme";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={brand.primary300} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: brand.white },
      }}
      initialRouteName="splash"
    >
      <Stack.Screen
        name="splash"
        options={{ contentStyle: { backgroundColor: brand.primary900 } }}
      />
      <Stack.Screen name="login" />
      <Stack.Screen name="email" />
    </Stack>
  );
}

const s = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: brand.primary900,
    justifyContent: "center",
    alignItems: "center",
  },
});

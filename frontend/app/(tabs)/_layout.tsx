import { Tabs } from "expo-router";
import CustomTabBar from "@/components/navigation/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Chỉ để lại các Tab chính xuất hiện trên thanh điều hướng */}
      <Tabs.Screen name="home" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="favourite" options={{ title: "Món ăn" }}/>
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="shopping" />
      <Tabs.Screen name="ingredient" />
    </Tabs>
  );
}
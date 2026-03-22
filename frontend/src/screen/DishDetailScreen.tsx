import React from "react";
import { SafeAreaView } from "react-native";
import { useDishDetailUI } from "@/src/hooks/useDishDetailUI";
import DishDetailContent from "@/components/home/DishDetailContent";

export default function DishDetailScreen() {
  const {
    dish,
    loading,
    errors,
    onBack,
    onToggleFavorite,
    retry,
  } = useDishDetailUI();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F6F6" }}>
      <DishDetailContent
        dish={dish}
        loading={loading}
        generalError={errors.general}
        onBack={onBack}
        onToggleFavorite={onToggleFavorite}
        onRetry={retry}
      />
    </SafeAreaView>
  );
}
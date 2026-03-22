import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  styles: any;
  weekTitle: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCopyWeek: () => void;
  onClearWeek: () => void;
  onPressShoppingWeek?: () => void;
};

export default function MealPlanHeader({
  styles,
  weekTitle,
  onPreviousWeek,
  onNextWeek,
  onCopyWeek,
  onClearWeek,
  onPressShoppingWeek,
}: Props) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>THỰC ĐƠN TUẦN</Text>
        <Ionicons name="chatbubble-ellipses-outline" size={34} color="#5D9625" />
      </View>

      <View style={styles.weekSwitcher}>
        <TouchableOpacity style={styles.circleButton} onPress={onPreviousWeek}>
          <Ionicons name="chevron-back" size={18} color="#5D9625" />
        </TouchableOpacity>

        <Text style={styles.weekTitle}>{weekTitle}</Text>

        <TouchableOpacity style={styles.circleButton} onPress={onNextWeek}>
          <Ionicons name="chevron-forward" size={18} color="#5D9625" />
        </TouchableOpacity>
      </View>

      <View style={styles.topActionRow}>
        <TouchableOpacity style={styles.smallGreenButton} onPress={onCopyWeek}>
          <Feather name="copy" size={14} color="#FFFFFF" />
          <Text style={styles.smallButtonText}>Bản sao tuần</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallGreenButton}
          onPress={onPressShoppingWeek}
        >
          <MaterialCommunityIcons name="cart-outline" size={14} color="#FFFFFF" />
          <Text style={styles.smallButtonText}>Mua sắm tuần</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallRedButton} onPress={onClearWeek}>
          <Feather name="trash-2" size={14} color="#FFFFFF" />
          <Text style={styles.smallButtonText}>Xóa thực đơn tuần</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
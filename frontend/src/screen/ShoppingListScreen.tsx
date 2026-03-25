import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useShoppingListUI } from "@/src/hooks/useShoppingListUI";
import ShoppingListCard from "@/components/shopping/ShoppingListCard";

export default function ShoppingListScreen() {
  const {
    search,
    setSearch,
    shoppingLists,
    loading,
    refreshing,
    error,
    emptyText,
    onRefresh,
    onPressList,
    onDeleteList,
  } = useShoppingListUI();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <FlatList
        data={shoppingLists}
        keyExtractor={(item) => String(item.shopping_id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <View>
            <Text style={styles.screenTitle}>DANH SÁCH MUA SẮM</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={22} color="#9A9A9A" />
              <TextInput
                placeholder="Tìm kiếm"
                placeholderTextColor="#9A9A9A"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <ShoppingListCard
            item={item}
            styles={styles}
            onPress={() => onPressList(item.shopping_id)}
            onDelete={() => onDeleteList(item.shopping_id)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6B9D2E" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DDE5DE",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#5D9722",
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  searchBox: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2F2F2F",
  },
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#383838",
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 14,
    color: "#9A9A9A",
  },
  emptyBox: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: "#777",
    fontSize: 15,
    textAlign: "center",
  },
  errorText: {
    marginBottom: 12,
    color: "#D93A3A",
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
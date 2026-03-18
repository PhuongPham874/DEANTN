import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DishCard from "@/components/home/DishCard";
import { useFavoriteUI } from "@/src/hooks/useFavoriteUI";

export default function FavoriteScreen() {
  const {
    dishes,
    search,
    setSearch,
    loading,
    refreshing,
    error,
    emptyText,
    onPressDish,
    onPressEdit,
    onPressDelete,
    onPressCreate,
    onRefresh,
    onToggleFavorite
  } = useFavoriteUI();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={dishes}
        keyExtractor={(item) => String(item.source_dish_id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>YÊU THÍCH</Text>

              <TouchableOpacity activeOpacity={0.8} style={styles.headerIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color="#669C2F"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm kiếm"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <DishCard
              item={item}
              onPress={() => onPressDish(item.dish_id)}
              onPressFavorite={() => onToggleFavorite(item.dish_id)}
              showFavoriteButton
              showManageActions
              onPressEdit={onPressEdit}
              onPressDelete={onPressDelete}
            />
          </View>
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
          <ActivityIndicator size="large" color="#669C2F" />
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={onPressCreate}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E2EDE5",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#669C2F",
    letterSpacing: 0.5,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#222222",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardWrapper: {
    width: "48%",
  },
  emptyBox: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    marginBottom: 12,
    color: "#D62828",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 88,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#669C2F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
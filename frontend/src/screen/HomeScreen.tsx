import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DishCard from "@/components/home/DishCard";
import { useHomeUI } from "@/src/hooks/useHomeUI";

export default function HomeScreen() {
  const {
    username,
    categories,
    dishes,
    search,
    setSearch,
    selectedCategory,
    loading,
    error,
    onSelectCategory,
    onToggleFavorite,
    onPressDish,
  } = useHomeUI();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={dishes}
        keyExtractor={(item) => String(item.dish_id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hi {username || "bạn"},</Text>
                <Text style={styles.title}>Hôm nay bạn ăn gì?</Text>
              </View>

              <View style={styles.headerRight}>
                <Ionicons name="sparkles-outline" size={28} color="#669C2F" />
                <View style={styles.avatar} />
              </View>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabList}
            >
              {categories.map((item) => {
                const isActive = item.key === selectedCategory;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.tabItem, isActive && styles.tabItemActive]}
                    activeOpacity={0.8}
                    onPress={() => onSelectCategory(item.key)}
                  >
                    <Text
                      style={[styles.tabText, isActive && styles.tabTextActive]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <DishCard
              item={item}
              onPress={onPressDish}
              onPressFavorite={onToggleFavorite}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Không có món ăn phù hợp</Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#669C2F" />
        </View>
      )}
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  greeting: {
    fontSize: 14,
    color: "#2F2F2F",
  },
  title: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "600",
    color: "#2F2F2F",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D9D9D9",
    marginLeft: 12,
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
  tabList: {
    paddingBottom: 16,
  },
  tabItem: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B7C7A7",
    backgroundColor: "#EDF2EC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    marginRight: 12,
  },
  tabItemActive: {
    backgroundColor: "#669C2F",
    borderColor: "#669C2F",
  },
  tabText: {
    fontSize: 16,
    color: "#2F2F2F",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
});
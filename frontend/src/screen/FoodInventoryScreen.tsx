import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import IngredientModal from "@/components/individualDishForm/IngredientModal";
import { useFoodInventoryUI } from "@/src/hooks/useFoodInventoryUI";

type InventoryCardProps = {
  name: string;
  subtitle: string;
  onDelete: () => void;
  deleting?: boolean;
};

function InventoryCard({
  name,
  subtitle,
  onDelete,
  deleting,
}: InventoryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onDelete}
          activeOpacity={0.8}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#E14B4B" />
          ) : (
            <Feather name="trash-2" size={20} color="#E14B4B" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FoodInventoryScreen() {
  const {
    items,
    loading,
    refreshing,
    error,
    emptyText,

    search,
    setSearch,
    selectedGroup,
    setSelectedGroup,
    groupTabs,

    modalVisible,
    draft,
    draftErrors,
    deletingItemId,
    savingDraft,

    unitOptions,
    groupOptions,
    categoryOptions,

    onRefresh,
    reload,

    openCreateModal,
    closeModal,
    onChangeDraft,
    onSaveDraft,
    onDeleteItem,
    getItemSubtitle,
  } = useFoodInventoryUI();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor="#DDE5DE"
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.food_inventory_id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>NGUYÊN LIỆU</Text>

              <TouchableOpacity style={styles.aiButton} activeOpacity={0.8}>
                <Ionicons name="sparkles-outline" size={26} color="#6B9D2E" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={22} color="#9C9C9C" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm kiếm"
                placeholderTextColor="#9C9C9C"
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabList}
            >
              {groupTabs.map((tab) => {
                const active = tab.key === selectedGroup;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabItem, active && styles.tabItemActive]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedGroup(tab.key)}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#6B9D2E" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{emptyText}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => reload(false)}>
                <Text style={styles.retryText}>Tải lại</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <InventoryCard
              name={item.ingredient_name}
              subtitle={getItemSubtitle(item)}
              deleting={deletingItemId === item.food_inventory_id}
              onDelete={() => onDeleteItem(item)}
            />
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.88}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <IngredientModal
        visible={modalVisible}
        draft={draft}
        errors={draftErrors}
        unitOptions={unitOptions}
        groupOptions={groupOptions}
        categoryOptions={categoryOptions}
        onChangeDraft={onChangeDraft}
        onClose={closeModal}
        onSave={onSaveDraft}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DDE5DE",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#5D9722",
    letterSpacing: 0.5,
    marginBottom: 18,
  },

  aiButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2F2F2F",
  },

  tabList: {
    paddingBottom: 18,
    gap: 12,
  },
  tabItem: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B7C7A7",
    backgroundColor: "#EDF2EC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
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
    color: "#FFF",
    fontWeight: "700",
  },

  cardWrap: {
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3A3A3A",
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 14,
    color: "#8B8B8B",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  fab: {
    position: "absolute",
    right: 22,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#669C2F",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  centerBox: {
    paddingTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 70,
  },
  emptyText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#6B9D2E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "700",
  },
  errorText: {
    color: "#D93A3A",
    fontSize: 14,
    marginBottom: 12,
  },
});
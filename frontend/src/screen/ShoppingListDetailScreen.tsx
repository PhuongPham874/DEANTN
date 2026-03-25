import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import IngredientModal from "@/components/individualDishForm/IngredientModal";
import ShoppingItemCard from "@/components/shopping/ShoppingItemCard";
import { useShoppingListDetailUI } from "@/src/hooks/useShoppingListDetailUI";

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN");
}

type RowItem =
  | { type: "section"; key: string; title: string; count: number; showInventory?: boolean }
  | { type: "item"; key: string; item: any; checked: boolean }
  | { type: "empty"; key: string };

export default function ShoppingListDetailScreen() {
  const {
    detail,
    loading,
    error,
    pendingItems,
    boughtItems,
    submittingItemId,
    deletingItemId,
    modalVisible,
    draft,
    draftErrors,
    groupOptions,
    categoryOptions,
    onBack,
    reload,
    onToggleStatus,
    onDeleteItem,
    openCreateModal,
    closeModal,
    onChangeDraft,
    onSaveDraft,
  } = useShoppingListDetailUI();

  const data: RowItem[] = React.useMemo(() => {
    const rows: RowItem[] = [
      {
        type: "section",
        key: "pending-section",
        title: "Cần mua",
        count: detail?.pending_count ?? pendingItems.length,
      },
    ];

    pendingItems.forEach((item) => {
      rows.push({
        type: "item",
        key: `pending-${item.item_id}`,
        item,
        checked: false,
      });
    });

    rows.push({
      type: "section",
      key: "bought-section",
      title: "Đã mua",
      count: detail?.bought_count ?? boughtItems.length,
      showInventory: true,
    });

    boughtItems.forEach((item) => {
      rows.push({
        type: "item",
        key: `bought-${item.item_id}`,
        item,
        checked: true,
      });
    });

    if (!pendingItems.length && !boughtItems.length) {
      rows.push({
        type: "empty",
        key: "empty-state",
      });
    }

    return rows;
  }, [detail, pendingItems, boughtItems]);

  const renderItem: ListRenderItem<RowItem> = ({ item }) => {
    if (item.type === "section") {
      return (
        <View
          style={[
            styles.sectionHeader,
            item.showInventory && styles.sectionHeaderWithAction,
          ]}
        >
          <Text style={styles.sectionTitle}>
            {item.title} ({item.count})
          </Text>

          {item.showInventory ? (
            <TouchableOpacity style={styles.inventoryBtn} activeOpacity={0.85}>
              <Feather name="archive" size={14} color="#FFF" />
              <Text style={styles.inventoryBtnText}>Thêm vào kho</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    if (item.type === "empty") {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            Danh sách mua sắm chưa có nguyên liệu
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cardWrap}>
        <ShoppingItemCard
          item={item.item}
          styles={styles}
          checked={item.checked}
          toggling={submittingItemId === item.item.item_id}
          deleting={deletingItemId === item.item.item_id}
          onToggle={() => onToggleStatus(item.item.item_id)}
          onDelete={
            item.checked ? undefined : () => onDeleteItem(item.item.item_id)
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color="#5D9722" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {detail?.list_name ?? "Chi tiết mua sắm"}
          </Text>
          <Text style={styles.createdDate}>
            Ngày tạo: {formatDate(detail?.created_date)}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6B9D2E" />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => reload(true)}>
            <Text style={styles.retryText}>Tải lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={data}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
            <Ionicons name="add" size={30} color="#FFF" />
          </TouchableOpacity>
        </>
      )}

      <IngredientModal
        visible={modalVisible}
        draft={draft}
        errors={draftErrors}
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

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 16,
    marginBottom: 18,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#5D9722",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "transparent",
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5D9722",
    letterSpacing: 0.3,
    marginBottom: 6,
    flexShrink: 1,
  },
  createdDate: {
    fontSize: 12,
    color: "#444",
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },

  sectionHeader: {
    marginBottom: 12,
    marginTop: 6,
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    color: "#777",
    flexShrink: 1,
  },

  cardWrap: {
    marginBottom: 14,
  },

  inventoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6B9D2E",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 36,
    flexShrink: 0,
    gap: 8,
  },
  inventoryBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  itemCard: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  checkButton: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#222",
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#383838",
    marginBottom: 8,
    flexShrink: 1,
  },
  itemTitleBought: {
    fontSize: 17,
    fontWeight: "800",
    color: "#999",
    marginBottom: 8,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  itemMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
    columnGap: 16,
  },
  itemMeta: {
    fontSize: 14,
    color: "#9A9A9A",
  },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 28,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#6B9D2E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#D93A3A",
    fontSize: 15,
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

  emptyWrap: {
    alignItems: "center",
    paddingTop: 36,
  },
  emptyText: {
    color: "#777",
    fontSize: 15,
    textAlign: "center",
  },
});
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import {
  createFoodInventory,
  deleteFoodInventory,
  FoodInventoryItem,
  getFoodInventoryList,
  updateFoodInventory,
} from "@/src/api/foodInventoryApi";

type DraftState = {
  ingredient_name: string;
  quantity: string;
  unit: string;
  group_name: string;
  category: string;
};

type DraftErrors = Partial<Record<keyof DraftState, string>>;

type OptionItem = {
  label: string;
  value: string;
};

const GROUP_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "rau củ", label: "Rau củ" },
  { key: "thịt", label: "Thịt" },
  { key: "cá-hải sản", label: "Cá-Hải sản" },
  { key: "sữa-trứng", label: "Sữa - Trứng" },
  { key: "trái cây", label: "Trái cây" },
  { key: "gia vị", label: "Gia vị" },
  { key: "khác", label: "Khác" },
] as const;

const unitOptions: OptionItem[] = [
  { label: "Chọn đơn vị", value: "" },
  { label: "g", value: "g" },
  { label: "kg", value: "kg" },
  { label: "ml", value: "ml" },
  { label: "l", value: "l" },
  { label: "quả", value: "quả" },
  { label: "củ", value: "củ" },
  { label: "bó", value: "bó" },
  { label: "gói", value: "gói" },
  { label: "chai", value: "chai" },
  { label: "lon", value: "lon" },
  { label: "bịch", value: "bịch" },
  { label: "hộp", value: "hộp" },
  { label: "hũ", value: "hũ" },
  { label: "lọ", value: "lọ" },
];

const groupOptions: OptionItem[] = [
  { label: "Chọn nhóm", value: "" },
  { label: "Rau củ", value: "rau củ" },
  { label: "Thịt", value: "thịt" },
  { label: "Cá - Hải sản", value: "cá-hải sản" },
  { label: "Sữa - Trứng", value: "sữa-trứng" },
  { label: "Trái cây", value: "trái cây" },
  { label: "Gia vị", value: "gia vị" },
  { label: "Khác", value: "khác" },
];

const categoryOptions: OptionItem[] = [
  { label: "Chọn loại", value: "" },
  { label: "Thực phẩm", value: "thực phẩm" },
  { label: "Gia vị", value: "gia vị" },
];

function createInitialDraft(): DraftState {
  return {
    ingredient_name: "",
    quantity: "",
    unit: "",
    group_name: "",
    category: "",
  };
}

function normalizeError(error: any) {
  return error?.message || "Đã có lỗi xảy ra";
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function useFoodInventoryUI() {
  const [items, setItems] = useState<FoodInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodInventoryItem | null>(null);
  const [draft, setDraft] = useState<DraftState>(createInitialDraft());
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  const fetchList = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError("");

        const response = await getFoodInventoryList({
          search,
          group_name: selectedGroup,
        });

        setItems(response.data.items ?? []);
      } catch (err: any) {
        setError(normalizeError(err));
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [search, selectedGroup]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchList(true);
    }, 250);

    return () => clearTimeout(timeout);
  }, [fetchList]);

  useFocusEffect(
    useCallback(() => {
      fetchList(false);
    }, [fetchList])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchList(false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchList]);

  const onChangeDraft = useCallback((field: keyof DraftState, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));

    setDraftErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingItem(null);
    setDraft(createInitialDraft());
    setDraftErrors({});
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item: FoodInventoryItem) => {
    setEditingItem(item);
    setDraft({
      ingredient_name: item.ingredient_name,
      quantity: formatQuantity(item.quantity),
      unit: item.unit,
      group_name: item.group_name,
      category: item.category,
    });
    setDraftErrors({});
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    if (savingDraft) return;
    setModalVisible(false);
  }, [savingDraft]);

  const GROUP_LABEL_MAP = Object.fromEntries(
    groupOptions.map(opt => [opt.value, opt.label])
    );

  const validateDraft = useCallback(() => {
    const nextErrors: DraftErrors = {};

    if (!draft.ingredient_name.trim()) {
      nextErrors.ingredient_name = "Vui lòng điền đầy đủ thông tin";
    }

    if (!draft.quantity.trim()) {
      nextErrors.quantity = "Vui lòng điền đầy đủ thông tin";
    } else if (Number.isNaN(Number(draft.quantity)) || Number(draft.quantity) <= 0) {
      nextErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!draft.group_name.trim()) {
      nextErrors.group_name = "Vui lòng điền đầy đủ thông tin";
    }

    if (!draft.category.trim()) {
      nextErrors.category = "Vui lòng điền đầy đủ thông tin";
    }

    if (!draft.unit.trim()) {
      nextErrors.unit = "Vui lòng điền đầy đủ thông tin";
    }

    setDraftErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [draft]);

  const onSaveDraft = useCallback(async () => {
    if (!validateDraft()) return;

    try {
      setSavingDraft(true);

      const payload = {
        ingredient_name: draft.ingredient_name.trim(),
        quantity: Number(draft.quantity),
        unit: draft.unit.trim(),
        group_name: draft.group_name,
        category: draft.category,
      };

      const response = editingItem
        ? await updateFoodInventory(editingItem.food_inventory_id, payload)
        : await createFoodInventory(payload);

      Alert.alert(
        "Thông báo",
        response.message ||
          (editingItem ? "Cập nhật nguyên liệu thành công" : "Thêm nguyên liệu thành công")
      );

      setModalVisible(false);
      setEditingItem(null);
      setDraft(createInitialDraft());
      setDraftErrors({});
      await fetchList(false);
    } catch (err: any) {
      Alert.alert("Thông báo", normalizeError(err));
    } finally {
      setSavingDraft(false);
    }
  }, [draft, editingItem, fetchList, validateDraft]);

  const onDeleteItem = useCallback(
    (item: FoodInventoryItem) => {
      Alert.alert(
        "Xác nhận xóa nguyên liệu",
        `Bạn có chắc muốn xóa "${item.ingredient_name}" không?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              try {
                setDeletingItemId(item.food_inventory_id);
                await deleteFoodInventory(item.food_inventory_id);
                await fetchList(false);
              } catch (err: any) {
                Alert.alert("Thông báo", normalizeError(err));
              } finally {
                setDeletingItemId(null);
              }
            },
          },
        ]
      );
    },
    [fetchList]
  );

  const getItemSubtitle = useCallback((item: FoodInventoryItem) => {
  const amount = `${formatQuantity(item.quantity)} ${item.unit}`.trim();
  
  // Lấy label từ bảng tra cứu, nếu không có thì dùng chính group_name
  const displayGroupName = GROUP_LABEL_MAP[item.group_name] || item.group_name;

  // Trả về chuỗi với Label đẹp hơn
    return `${displayGroupName}    ${amount}`;
    }, []);

  const emptyText = useMemo(() => {
    if (search.trim()) {
      return "Không tìm thấy nguyên liệu phù hợp";
    }
    return "Chưa có nguyên liệu trong kho";
  }, [search]);

  return {
    items,
    loading,
    refreshing,
    error,
    emptyText,

    search,
    setSearch,
    selectedGroup,
    setSelectedGroup,
    groupTabs: GROUP_TABS,

    modalVisible,
    editingItem,
    draft,
    draftErrors,
    savingDraft,
    deletingItemId,

    unitOptions,
    groupOptions,
    categoryOptions,

    reload: fetchList,
    onRefresh,

    openCreateModal,
    openEditModal,
    closeModal,
    onChangeDraft,
    onSaveDraft,
    onDeleteItem,
    getItemSubtitle,
  };
}
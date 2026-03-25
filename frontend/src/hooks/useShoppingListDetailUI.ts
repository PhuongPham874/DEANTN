import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import {
  createShoppingItem,
  deleteShoppingItem,
  getShoppingListDetail,
  ShoppingListDetail,
  toggleShoppingItemStatus,
} from "@/src/api/shoppingListApi";

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

const groupOptions: OptionItem[] = [
  { label: "Rau củ", value: "rau củ" },
  { label: "Thịt", value: "thịt" },
  { label: "Cá - Hải sản", value: "cá-hải sản" },
  { label: "Sữa - Trứng", value: "sữa-trứng" },
  { label: "Trái cây", value: "trái cây" },
  { label: "Gia vị", value: "gia vị" },
  { label: "Khác", value: "khác" },
];

const categoryOptions: OptionItem[] = [
  { label: "Thực phẩm", value: "thực phẩm" },
  { label: "Gia vị", value: "gia vị" },
];

function normalizeError(error: any) {
  return error?.message || "Đã có lỗi xảy ra";
}

function createInitialDraft(): DraftState {
  return {
    ingredient_name: "",
    quantity: "",
    unit: "",
    group_name: "",
    category: "",
  };
}

export function useShoppingListDetailUI() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shoppingId: string }>();
  const shoppingId = Number(params.shoppingId);

  const [detail, setDetail] = useState<ShoppingListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submittingItemId, setSubmittingItemId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<DraftState>(createInitialDraft());
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});
  const [savingDraft, setSavingDraft] = useState(false);

  const fetchDetail = useCallback(
    async (showLoading = true) => {
      if (!shoppingId || Number.isNaN(shoppingId)) {
        setError("Danh sách mua sắm không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        setError("");

        const response = await getShoppingListDetail(shoppingId);
        setDetail(response.data);
      } catch (err: any) {
        setError(normalizeError(err));
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [shoppingId]
  );

  useEffect(() => {
    fetchDetail(true);
  }, [fetchDetail]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail(false);
    }, [fetchDetail])
  );

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

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
    setDraft(createInitialDraft());
    setDraftErrors({});
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    if (savingDraft) return;
    setModalVisible(false);
  }, [savingDraft]);

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

    if (!draft.unit.trim()) {
      nextErrors.unit = "Vui lòng điền đầy đủ thông tin";
    }

    if (!draft.group_name.trim()) {
      nextErrors.group_name = "Vui lòng điền đầy đủ thông tin";
    }

    if (!draft.category.trim()) {
      nextErrors.category = "Vui lòng điền đầy đủ thông tin";
    }

    setDraftErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [draft]);

  const onSaveDraft = useCallback(async () => {
    if (!detail) return;
    if (!validateDraft()) return;

    try {
      setSavingDraft(true);

      await createShoppingItem(detail.shopping_id, {
        ingredient_name: draft.ingredient_name.trim(),
        quantity: Number(draft.quantity),
        unit: draft.unit.trim(),
        group_name: draft.group_name,
        category: draft.category,
      });

      setModalVisible(false);
      setDraft(createInitialDraft());
      setDraftErrors({});
      await fetchDetail(false);
    } catch (err: any) {
      Alert.alert("Thông báo", normalizeError(err));
    } finally {
      setSavingDraft(false);
    }
  }, [detail, draft, fetchDetail, validateDraft]);

  const onToggleStatus = useCallback(
    async (itemId: number) => {
      try {
        setSubmittingItemId(itemId);
        await toggleShoppingItemStatus(itemId);
        await fetchDetail(false);
      } catch (err: any) {
        Alert.alert("Thông báo", normalizeError(err));
      } finally {
        setSubmittingItemId(null);
      }
    },
    [fetchDetail]
  );

  const onDeleteItem = useCallback(
    (itemId: number) => {
      Alert.alert("Xóa nguyên liệu", "Bạn có chắc muốn xóa nguyên liệu này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingItemId(itemId);
              await deleteShoppingItem(itemId);
              await fetchDetail(false);
            } catch (err: any) {
              Alert.alert("Thông báo", normalizeError(err));
            } finally {
              setDeletingItemId(null);
            }
          },
        },
      ]);
    },
    [fetchDetail]
  );

  const pendingItems = useMemo(() => detail?.pending_items ?? [], [detail]);
  const boughtItems = useMemo(() => detail?.bought_items ?? [], [detail]);

  return {
    shoppingId,
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
    savingDraft,
    groupOptions,
    categoryOptions,

    onBack,
    reload: fetchDetail,

    onToggleStatus,
    onDeleteItem,

    openCreateModal,
    closeModal,
    onChangeDraft,
    onSaveDraft,
  };
}
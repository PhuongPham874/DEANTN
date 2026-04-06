import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/api/authFetch";

export type ShoppingListSummary = {
  shopping_id: number;
  list_name: string;
  list_type: "week" | "day";
  created_date: string;
  item_count: number;
};

export type ShoppingItem = {
  item_id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  status: "pending" | "bought";
  inventory_quantity: number;
};

export type ShoppingListDetail = {
  shopping_id: number;
  list_name: string;
  list_type: "week" | "day";
  created_date: string;
  plan_id: number | null;
  pending_count: number;
  bought_count: number;
  pending_items: ShoppingItem[];
  bought_items: ShoppingItem[];
};

export type ShoppingListsResponse = {
  message: string;
  data: {
    shopping_lists: ShoppingListSummary[];
  };
};

export type ShoppingListDetailResponse = {
  message: string;
  data: ShoppingListDetail;
};

export type DeleteShoppingListResponse = {
  message: string;
  data: {
    shopping_id: number;
  };
};

export type ToggleShoppingItemStatusResponse = {
  message: string;
  data: {
    item_id: number;
    shopping_id: number;
    status: "pending" | "bought";
  };
};

export type DeleteShoppingItemResponse = {
  message: string;
  data: {
    item_id: number;
    shopping_id: number;
  };
};

export type UpsertShoppingItemPayload = {
  ingredient_name: string;
  quantity: number;
  unit: string;
  group_name: string;
  category: string;
};

export type CreateShoppingItemResponse = {
  message: string;
  data: {
    item_id: number;
    ingredient_id: number;
    ingredient_name: string;
    quantity: number;
    unit: string;
    status: "pending" | "bought";
    inventory_quantity?: number;
  };
};

export type UpdateShoppingItemResponse = {
  message: string;
  data: {
    item_id: number;
    ingredient_id: number;
    ingredient_name: string;
    quantity: number;
    unit: string;
    status: "pending" | "bought";
    inventory_quantity?: number;
    merged_from_item_id?: number;
  };
};

export type GenerateShoppingListResponse = {
  success: boolean;
  message: string;
  data: ShoppingListSummary | null;
};

type GetShoppingListsParams = {
  search?: string;
};

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function getShoppingLists({
  search = "",
}: GetShoppingListsParams = {}): Promise<ShoppingListsResponse> {
  const query = new URLSearchParams();

  if (search.trim()) {
    query.append("search", search.trim());
  }

  const queryString = query.toString();
  const url = queryString
    ? `${API_BASE_URL}/shopping/shopping-lists/?${queryString}`
    : `${API_BASE_URL}/shopping/shopping-lists/`;

  const response = await authFetch(url, {
    method: "GET",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tải danh sách mua sắm");
  }

  return data as ShoppingListsResponse;
}

export async function getShoppingListDetail(
  shoppingId: number
): Promise<ShoppingListDetailResponse> {
  const query = new URLSearchParams({
    shopping_id: String(shoppingId),
  });

  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/detail/?${query.toString()}`,
    {
      method: "GET",
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tải chi tiết danh sách mua sắm");
  }

  return data as ShoppingListDetailResponse;
}

export async function deleteShoppingList(
  shoppingId: number
): Promise<DeleteShoppingListResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/delete/`,
    {
      method: "POST",
      body: JSON.stringify({
        shopping_id: shoppingId,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể xóa danh sách mua sắm");
  }

  return data as DeleteShoppingListResponse;
}

export async function toggleShoppingItemStatus(
  itemId: number
): Promise<ToggleShoppingItemStatusResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/items/toggle-status/`,
    {
      method: "POST",
      body: JSON.stringify({
        item_id: itemId,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể cập nhật trạng thái mua sắm");
  }

  return data as ToggleShoppingItemStatusResponse;
}

export async function deleteShoppingItem(
  itemId: number
): Promise<DeleteShoppingItemResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/items/delete/`,
    {
      method: "POST",
      body: JSON.stringify({
        item_id: itemId,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể xóa mục mua sắm");
  }

  return data as DeleteShoppingItemResponse;
}

export async function createShoppingItem(
  shoppingId: number,
  payload: UpsertShoppingItemPayload
): Promise<CreateShoppingItemResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/items/create/`,
    {
      method: "POST",
      body: JSON.stringify({
        shopping_id: shoppingId,
        ...payload,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể thêm nguyên liệu vào danh sách mua sắm");
  }

  return data as CreateShoppingItemResponse;
}

export async function updateShoppingItem(
  itemId: number,
  payload: UpsertShoppingItemPayload
): Promise<UpdateShoppingItemResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/items/update/`,
    {
      method: "POST",
      body: JSON.stringify({
        item_id: itemId,
        ...payload,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể cập nhật mục mua sắm");
  }

  return data as UpdateShoppingItemResponse;
}

export async function generateWeekShoppingList(
  startDate: string
): Promise<GenerateShoppingListResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/generate/week/`,
    {
      method: "POST",
      body: JSON.stringify({
        start_date: startDate,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tạo danh sách mua sắm tuần");
  }

  return data as GenerateShoppingListResponse;
}

export async function generateDayShoppingList(
  date: string
): Promise<GenerateShoppingListResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/shopping/shopping-lists/generate/day/`,
    {
      method: "POST",
      body: JSON.stringify({
        date,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tạo danh sách mua sắm ngày");
  }

  return data as GenerateShoppingListResponse;
}
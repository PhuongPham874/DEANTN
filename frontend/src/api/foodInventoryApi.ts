import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/api/authFetch";

export type FoodInventoryItem = {
  food_inventory_id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  group_name: string;
  category: string;
};

export type FoodInventoryListResponse = {
  message: string;
  data: {
    items: FoodInventoryItem[];
  };
};

export type FoodInventoryDetailResponse = {
  message: string;
  data: FoodInventoryItem;
};

export type UpsertFoodInventoryPayload = {
  ingredient_name: string;
  quantity: number;
  unit: string;
  group_name: string;
  category: string;
};

export type CreateFoodInventoryResponse = {
  message: string;
  data: {
    food_inventory_id: number;
    ingredient_id: number;
    ingredient_name: string;
    quantity: number;
    unit: string;
    group_name: string;
    category: string;
    merged_from_food_inventory_id?: number;
  };
};

export type DeleteFoodInventoryResponse = {
  message: string;
  data: {
    food_inventory_id: number;
  };
};

export type AddBoughtItemsToInventoryResponse = {
  message: string;
  data: {
    shopping_id: number;
    created_count: number;
    merged_count: number;
    moved_item_count: number;
    processed_item_ids: number[];
  };
};

type GetFoodInventoryParams = {
  search?: string;
  group_name?: string;
};

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function getFoodInventoryList({
  search = "",
  group_name = "",
}: GetFoodInventoryParams = {}): Promise<FoodInventoryListResponse> {
  const query = new URLSearchParams();

  if (search.trim()) {
    query.append("search", search.trim());
  }

  if (group_name.trim() && group_name !== "all") {
    query.append("group_name", group_name.trim());
  }

  const queryString = query.toString();
  const url = queryString
    ? `${API_BASE_URL}/inventory/?${queryString}`
    : `${API_BASE_URL}/inventory/`;

  const response = await authFetch(url, {
    method: "GET",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tải danh sách nguyên liệu");
  }

  return data as FoodInventoryListResponse;
}

export async function getFoodInventoryDetail(
  foodInventoryId: number
): Promise<FoodInventoryDetailResponse> {
  const query = new URLSearchParams({
    food_inventory_id: String(foodInventoryId),
  });

  const response = await authFetch(
    `${API_BASE_URL}/inventory/detail/?${query.toString()}`,
    {
      method: "GET",
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tải chi tiết nguyên liệu");
  }

  return data as FoodInventoryDetailResponse;
}

export async function createFoodInventory(
  payload: UpsertFoodInventoryPayload
): Promise<CreateFoodInventoryResponse> {
  const response = await authFetch(`${API_BASE_URL}/inventory/create/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể thêm nguyên liệu vào kho");
  }

  return data as CreateFoodInventoryResponse;
}

export async function deleteFoodInventory(
  foodInventoryId: number
): Promise<DeleteFoodInventoryResponse> {
  const response = await authFetch(`${API_BASE_URL}/inventory/delete/`, {
    method: "POST",
    body: JSON.stringify({
      food_inventory_id: foodInventoryId,
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể xóa nguyên liệu khỏi kho");
  }

  return data as DeleteFoodInventoryResponse;
}

export async function addBoughtItemsToInventory(
  shoppingId: number
): Promise<AddBoughtItemsToInventoryResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/inventory/add-bought-items/`,
    {
      method: "POST",
      body: JSON.stringify({
        shopping_id: shoppingId,
      }),
    }
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      data?.message || "Không thể thêm các nguyên liệu đã mua vào kho"
    );
  }

  return data as AddBoughtItemsToInventoryResponse;
}
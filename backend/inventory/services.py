from django.db import transaction

from rest_framework.exceptions import ValidationError

from home.services import IngredientInputService, IngredientMergeHelper
from shoppinglist.services import ShoppingListService
from shoppinglist.models import ShoppingList, ShoppingItem
from .models import FoodInventory


class FoodInventoryService:
    @staticmethod
    def _build_food_inventory_item(item):
        return {
            "food_inventory_id": item.food_inventory_id,
            "ingredient_id": item.ingredient_id,
            "ingredient_name": item.ingredient.ingredient_name,
            "group_name": item.ingredient.group_name,
            "category": item.ingredient.category,
            "quantity": item.quantity,
            "unit": item.unit,
        }

    @staticmethod
    def _find_mergeable_inventory_item(
        user,
        ingredient_name,
        unit,
        exclude_food_inventory_id=None,
    ):
        queryset = (
            FoodInventory.objects.filter(
                user=user,
                ingredient__ingredient_name__iexact=(ingredient_name or "").strip(),
            )
            .select_related("ingredient")
            .order_by("food_inventory_id")
        )

        if exclude_food_inventory_id is not None:
            queryset = queryset.exclude(food_inventory_id=exclude_food_inventory_id)

        normalized_unit = IngredientMergeHelper.normalize_unit(unit)

        for existing_item in queryset:
            existing_unit = IngredientMergeHelper.normalize_unit(existing_item.unit)

            if IngredientMergeHelper.can_merge(existing_unit, normalized_unit):
                return existing_item

        return None

    @staticmethod
    def _merge_inventory_quantity(existing_item, quantity, unit):
        merged_result = IngredientMergeHelper.merge_two(
            quantity_a=existing_item.quantity,
            unit_a=existing_item.unit,
            quantity_b=quantity,
            unit_b=unit,
        )

        if merged_result is None:
            return None

        existing_item.quantity = merged_result["quantity"]
        existing_item.unit = merged_result["unit"]
        existing_item.save(update_fields=["quantity", "unit"])

        return existing_item

    @staticmethod
    def get_food_inventory_list(user, search="", group_name=""):
        queryset = (
            FoodInventory.objects.filter(user=user)
            .select_related("ingredient")
            .order_by("ingredient__ingredient_name", "food_inventory_id")
        )

        if search:
            queryset = queryset.filter(
                ingredient__ingredient_name__icontains=search.strip()
            )

        if group_name and group_name != "all":
            queryset = queryset.filter(ingredient__group_name=group_name)

        return {
            "items": [
                FoodInventoryService._build_food_inventory_item(item)
                for item in queryset
            ]
        }

    @staticmethod
    def get_food_inventory_detail(user, food_inventory_id):
        item = (
            FoodInventory.objects.filter(
                food_inventory_id=food_inventory_id,
                user=user,
            )
            .select_related("ingredient")
            .first()
        )

        if not item:
            return {
                "success": False,
                "message": "Không tìm thấy nguyên liệu trong kho",
                "data": None,
            }

        return {
            "success": True,
            "message": "Lấy chi tiết nguyên liệu trong kho thành công",
            "data": FoodInventoryService._build_food_inventory_item(item),
        }
    
    @staticmethod
    def _validate_inventory_metadata_from_input(validated_data, matched_item):
        if not matched_item:
            return

        errors = {}

        input_group_name = (validated_data.get("group_name") or "").strip()
        matched_group_name = (matched_item.ingredient.group_name or "").strip()

        input_category = (validated_data.get("category") or "").strip()
        matched_category = (matched_item.ingredient.category or "").strip()

        if input_group_name != matched_group_name:
            errors["group_name"] = (
                "Nguyên liệu này đã được lưu với nhóm nguyên liệu khác."
            )

        if input_category != matched_category:
            errors["category"] = (
                "Nguyên liệu này đã được lưu với loại nguyên liệu khác."
            )

        if errors:
            raise ValidationError(errors)

    @staticmethod
    @transaction.atomic
    def create_food_inventory(user, validated_data):
        quantity = validated_data["quantity"]
        unit = validated_data["unit"]
        ingredient_name = (validated_data.get("ingredient_name") or "").strip()

        mergeable_item = FoodInventoryService._find_mergeable_inventory_item(
            user=user,
            ingredient_name=ingredient_name,
            unit=unit,
        )

        if mergeable_item:
            FoodInventoryService._validate_inventory_metadata_from_input(
                validated_data=validated_data,
                matched_item=mergeable_item,
            )

            merged_item = FoodInventoryService._merge_inventory_quantity(
                existing_item=mergeable_item,
                quantity=quantity,
                unit=unit,
            )
            if merged_item:
                return {
                    "success": True,
                    "message": "Thêm nguyên liệu mới thành công",
                    "data": FoodInventoryService._build_food_inventory_item(merged_item),
                }

        ingredient, _, normalized_data = IngredientInputService.get_or_create_ingredient(
            validated_data
        )

        item = FoodInventory.objects.create(
            user=user,
            ingredient=ingredient,
            quantity=normalized_data["quantity"],
            unit=normalized_data["unit"],
        )

        return {
            "success": True,
            "message": "Thêm nguyên liệu mới thành công",
            "data": FoodInventoryService._build_food_inventory_item(item),
        }

    @staticmethod
    @transaction.atomic
    def delete_food_inventory(user, food_inventory_id):
        item = FoodInventory.objects.filter(
            food_inventory_id=food_inventory_id,
            user=user,
        ).first()

        if not item:
            return {
                "success": False,
                "message": "Không tìm thấy nguyên liệu trong kho",
                "data": None,
            }

        item.delete()

        return {
            "success": True,
            "message": "Xóa nguyên liệu khỏi kho thành công",
            "data": {
                "food_inventory_id": food_inventory_id,
            },
        }

    @staticmethod
    @transaction.atomic
    def add_bought_items_to_inventory(user, shopping_id):
        shopping_list = ShoppingList.objects.filter(
            shopping_id=shopping_id,
            user=user,
        ).first()

        if not shopping_list:
            return {
                "success": False,
                "message": "Không tìm thấy danh sách mua sắm",
                "data": None,
            }

        # Lấy QuerySet các item đã mua
        bought_items_queryset = ShoppingItem.objects.filter(
            shopping=shopping_list,
            status="bought",
        ).select_related("ingredient")

        # Chuyển thành list để thực hiện loop logic hiện tại của bạn
        bought_items = list(bought_items_queryset)

        if not bought_items:
            return {
                "success": False,
                "message": "Không có nguyên liệu đã mua để thêm vào kho",
                "data": None,
            }

        created_count = 0
        merged_count = 0
        moved_item_count = 0
        processed_item_ids = []

        for shopping_item in bought_items:
            mergeable_item = FoodInventoryService._find_mergeable_inventory_item(
                user=user,
                ingredient_name=shopping_item.ingredient.ingredient_name,
                unit=shopping_item.unit,
            )

            if mergeable_item:
                merged_item = FoodInventoryService._merge_inventory_quantity(
                    existing_item=mergeable_item,
                    quantity=shopping_item.quantity,
                    unit=shopping_item.unit,
                )
                if merged_item:
                    merged_count += 1
            else:
                FoodInventory.objects.create(
                    user=user,
                    ingredient=shopping_item.ingredient,
                    quantity=shopping_item.quantity,
                    unit=shopping_item.unit,
                )
                created_count += 1

            moved_item_count += 1
            processed_item_ids.append(shopping_item.item_id)

        bought_items_queryset.delete()
        delete_result = ShoppingListService._delete_shopping_list_if_empty(shopping_list)

        return {
            "success": True,
            "message": "Đã cập nhật nguyên liệu vào kho thực phẩm",
            "data": {
                "shopping_id": shopping_id,
                "created_count": created_count,
                "merged_count": merged_count,
                "moved_item_count": moved_item_count,
                "processed_item_ids": processed_item_ids,
                "shopping_deleted": delete_result["deleted"],
            },
        }
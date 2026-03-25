from django.db import transaction


from home.services import IngredientInputService
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
                "message": "Không tìm thấy thực phẩm",
                "data": None,
            }

        return {
            "success": True,
            "message": "Lấy chi tiết thực phẩm thành công",
            "data": FoodInventoryService._build_food_inventory_item(item),
        }

    @staticmethod
    @transaction.atomic
    def create_food_inventory(user, validated_data):
        ingredient, _, normalized_data = IngredientInputService.get_or_create_ingredient(validated_data)

        quantity = normalized_data["quantity"]
        unit = normalized_data["unit"]

        existing_item = FoodInventory.objects.filter(
            user=user,
            ingredient=ingredient,
            unit=unit,
        ).first()

        if existing_item:
            existing_item.quantity += quantity
            existing_item.save(update_fields=["quantity"])

            return {
                "success": True,
                "message": "Thêm thực phẩm thành công",
                "data": FoodInventoryService._build_food_inventory_item(existing_item),
            }

        item = FoodInventory.objects.create(
            user=user,
            ingredient=ingredient,
            quantity=quantity,
            unit=unit,
        )

        return {
            "success": True,
            "message": "Thêm thực phẩm thành công",
            "data": FoodInventoryService._build_food_inventory_item(item),
        }

    @staticmethod
    @transaction.atomic
    def update_food_inventory(user, validated_data):
        food_inventory_id = validated_data["food_inventory_id"]

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
                "message": "Không tìm thấy thực phẩm",
                "data": None,
            }

        ingredient, _, normalized_data = IngredientInputService.get_or_create_ingredient(validated_data)

        quantity = normalized_data["quantity"]
        unit = normalized_data["unit"]

        duplicate_item = FoodInventory.objects.filter(
            user=user,
            ingredient=ingredient,
            unit=unit,
        ).exclude(food_inventory_id=item.food_inventory_id).first()

        if duplicate_item:
            duplicate_item.quantity += quantity
            duplicate_item.save(update_fields=["quantity"])
            old_id = item.food_inventory_id
            item.delete()

            return {
                "success": True,
                "message": "Cập nhật thực phẩm thành công",
                "data": {
                    **FoodInventoryService._build_food_inventory_item(duplicate_item),
                    "merged_from_food_inventory_id": old_id,
                },
            }

        item.ingredient = ingredient
        item.quantity = quantity
        item.unit = unit
        item.save(update_fields=["ingredient", "quantity", "unit"])

        return {
            "success": True,
            "message": "Cập nhật thực phẩm thành công",
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
                "message": "Không tìm thấy thực phẩm",
                "data": None,
            }

        item.delete()

        return {
            "success": True,
            "message": "Xóa thực phẩm thành công",
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

        bought_items = list(
            ShoppingItem.objects.filter(
                shopping=shopping_list,
                status="bought",
            ).select_related("ingredient")
        )

        if not bought_items:
            return {
                "success": False,
                "message": "Không có mục đã mua để thêm vào kho",
                "data": None,
            }

        created_count = 0
        updated_count = 0
        deleted_item_ids = []

        for shopping_item in bought_items:
            inventory_item, created = FoodInventory.objects.get_or_create(
                user=user,
                ingredient=shopping_item.ingredient,
                unit=shopping_item.unit,
                defaults={"quantity": shopping_item.quantity},
            )

            if created:
                created_count += 1
            else:
                inventory_item.quantity += shopping_item.quantity
                inventory_item.save(update_fields=["quantity"])
                updated_count += 1

            deleted_item_ids.append(shopping_item.item_id)

        ShoppingItem.objects.filter(item_id__in=deleted_item_ids).delete()

        return {
            "success": True,
            "message": "Thêm các mục đã mua vào kho thành công",
            "data": {
                "shopping_id": shopping_id,
                "created_count": created_count,
                "updated_count": updated_count,
                "moved_item_count": len(deleted_item_ids),
                "deleted_item_ids": deleted_item_ids,
            },
        }
    


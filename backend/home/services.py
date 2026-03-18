from .models import Dish, IndividualDish, Ingredient, DishDetail, DishMethod
from collections import OrderedDict
from django.db import transaction
from django.db.models import Q

class HomeService:
    @staticmethod
    def get_categories():
        return [
            {"key": "all", "label": "Tất cả"},
            {"key": "Main Dish", "label": "Món chính"},
            {"key": "Side Dish", "label": "Món phụ"},
            {"key": "Salad", "label": "Salad"},
            {"key": "Soup", "label": "Canh/Súp"},
            {"key": "Dessert", "label": "Tráng miệng"},
            {"key": "Drink", "label": "Đồ uống"},
        ]

    @staticmethod
    def get_category_label(category_name: str) -> str:
        return dict(Dish.CATEGORY_CHOICES).get(category_name, category_name)

    @staticmethod
    def build_image_url(request, dish):
        if not dish.image:
            return None
        return request.build_absolute_uri(dish.image.url)

    @staticmethod
    def get_home_dishes(request, user, search="", category="", favorite_only=False):
        queryset = Dish.objects.filter(is_system=True).order_by("dish_id")

        queryset = HomeService.apply_dish_search(queryset, search)

        if category and category != "all":
            queryset = queryset.filter(category_name__iexact=category.strip())

        favorite_source_ids = set(
            IndividualDish.objects.filter(
                user=user,
                is_favorite=True,
                dish__is_system=False,
                dish__source_dish__isnull=False,
            ).values_list("dish__source_dish_id", flat=True)
        )

        if favorite_only:
            queryset = queryset.filter(dish_id__in=favorite_source_ids)

        dishes = []
        for dish in queryset:
            dishes.append({
                "dish_id": dish.dish_id,
                "dish_name": dish.dish_name,
                "cooking_time": dish.cooking_time,
                "ration": dish.ration,
                "image": HomeService.build_image_url(request, dish),
                "category_name": dish.category_name,
                "category_label": HomeService.get_category_label(dish.category_name),
                "is_favorite": dish.dish_id in favorite_source_ids,
            })

        return {
            "user": {
                "username": user.username,
            },
            "categories": HomeService.get_categories(),
            "dishes": dishes,
        }

    @staticmethod
    def toggle_favorite(user, dish_id):
        dish = (
            Dish.objects
            .filter(dish_id=dish_id)
            .prefetch_related("dish_details__ingredient", "methods")
            .first()
        )

        if not dish:
            return {
                "success": False,
                "message": "Không tìm thấy món ăn",
                "data": None,
            }

        # =========================
        # 1) Món hệ thống
        # =========================
        if dish.is_system:
            existing_relation = (
                IndividualDish.objects
                .filter(
                    user=user,
                    dish__is_system=False,
                    dish__source_dish=dish,
                )
                .select_related("dish")
                .first()
            )

            # bỏ yêu thích -> xóa relation + xóa bản copy
            if existing_relation:
                with transaction.atomic():
                    copied_dish = existing_relation.dish
                    existing_relation.delete()
                    copied_dish.delete()

                return {
                    "success": True,
                    "message": "Đã bỏ món khỏi danh sách yêu thích",
                    "data": {
                        "source_dish_id": dish.dish_id,
                        "is_favorite": False,
                    },
                }

            # thêm yêu thích -> tạo bản copy
            with transaction.atomic():
                copied_dish = Dish.objects.create(
                    dish_name=dish.dish_name,
                    cooking_time=dish.cooking_time,
                    ration=dish.ration,
                    image=dish.image,
                    category_name=dish.category_name,
                    calories=dish.calories,
                    is_system=False,
                    source_dish=dish,
                )

                for detail in dish.dish_details.all():
                    DishDetail.objects.create(
                        dish=copied_dish,
                        ingredient=detail.ingredient,
                        quantity=detail.quantity,
                        unit=detail.unit,
                    )

                for method in dish.methods.all().order_by("step_number"):
                    DishMethod.objects.create(
                        dish=copied_dish,
                        step_number=method.step_number,
                        instruction=method.instruction,
                    )

                IndividualDish.objects.create(
                    user=user,
                    dish=copied_dish,
                    is_favorite=True,
                )

            return {
                "success": True,
                "message": "Đã thêm món vào danh sách yêu thích",
                "data": {
                    "source_dish_id": dish.dish_id,
                    "individual_dish_id": copied_dish.dish_id,
                    "is_favorite": True,
                },
            }

        # =========================
        # 2) Món người dùng tự tạo
        # =========================
        individual_relation = (
            IndividualDish.objects
            .filter(
                user=user,
                dish=dish,
                dish__is_system=False,
            )
            .select_related("dish")
            .first()
        )

        if not individual_relation:
            return {
                "success": False,
                "message": "Bạn không có quyền thao tác với món ăn này",
                "data": None,
            }

        individual_relation.is_favorite = not individual_relation.is_favorite
        individual_relation.save(update_fields=["is_favorite"])

        return {
            "success": True,
            "message": (
                "Đã thêm món vào danh sách yêu thích"
                if individual_relation.is_favorite
                else "Đã bỏ món khỏi danh sách yêu thích"
            ),
            "data": {
                "individual_dish_id": dish.dish_id,
                "source_dish_id": dish.source_dish_id if dish.source_dish_id else dish.dish_id,
                "is_favorite": individual_relation.is_favorite,
            },
        }
    
    @staticmethod
    def normalize_ingredient_category(category: str) -> str:
        normalized = (category or "").strip().lower()

        if normalized == "thực phẩm":
            return "Nguyên liệu chính"

        if normalized == "gia vị":
            return "Nguyên liệu gia vị"

        return "Nguyên liệu khác"

    @staticmethod
    def build_ingredient_display_text(quantity, unit: str, ingredient_name: str) -> str:
        unit = (unit or "").strip()
        ingredient_name = (ingredient_name or "").strip()

        compact_units = {"g", "kg", "ml", "l"}

        if unit in compact_units:
            amount_text = f"{quantity}{unit}" #những đơn vị cần viết liền
        elif unit:
            amount_text = f"{quantity} {unit}"
        else:
            amount_text = f"{quantity}"

        return " ".join(f"{amount_text} {ingredient_name}".split())

    @staticmethod
    def get_dish_detail(request, user, dish_id):
        dish = (
            Dish.objects.filter(dish_id=dish_id)
            .prefetch_related("methods", "dish_details__ingredient")
            .first()
        )

        if not dish:
            return {
                "success": False,
                "message": "Không tìm thấy món ăn",
                "data": None,
            }

        if dish.is_system:
            is_favorite = IndividualDish.objects.filter(
                user=user,
                dish__is_system=False,
                dish__source_dish=dish,
                is_favorite=True,
                ).exists()
        else:
            is_favorite = IndividualDish.objects.filter(
                user=user,
                dish=dish,
                is_favorite=True,
            ).exists()
        grouped_ingredients = OrderedDict()

        for detail in dish.dish_details.all():
            ui_category = HomeService.normalize_ingredient_category(
                detail.ingredient.category
            )

            if ui_category not in grouped_ingredients:
                grouped_ingredients[ui_category] = []

            grouped_ingredients[ui_category].append(
                {
                    "ingredient_id": detail.ingredient.ingredient_id,
                    "display_text": HomeService.build_ingredient_display_text(
                        quantity=detail.quantity,
                        unit=detail.unit,
                        ingredient_name=detail.ingredient.ingredient_name,
                    ),
                }
            )

        ingredients = [
            {
                "group_name": group_name,
                "items": items,
            }
            for group_name, items in grouped_ingredients.items()
        ]

        methods = [
            {
                "step_number": method.step_number,
                "instruction": method.instruction,
            }
            for method in dish.methods.all().order_by("step_number")
        ]

        return {
            "success": True,
            "message": "Lấy chi tiết món ăn thành công",
            "data": {
                "dish_id": dish.dish_id,
                "dish_name": dish.dish_name,
                "image": HomeService.build_image_url(request, dish),
                "cooking_time": dish.cooking_time,
                "ration": dish.ration,
                "calories": dish.calories,
                "category_name": dish.category_name,
                "category_label": HomeService.get_category_label(dish.category_name),
                "is_favorite": is_favorite,
                "ingredients": ingredients,
                "methods": methods,
                "source_dish_id": dish.source_dish_id
            },
        }
    
    @staticmethod
    def get_individual_dishes(request, user, search="", category=""):
        queryset = Dish.objects.filter(
            individual_dishes__user=user,
            is_system=False,
        ).distinct().order_by("dish_id")

        queryset = HomeService.apply_dish_search(queryset, search)

        if category and category != "all":
            queryset = queryset.filter(category_name__iexact=category.strip())

        dishes = []
        for dish in queryset:
            relation = dish.individual_dishes.filter(user=user).first()

            dishes.append({
                "dish_id": dish.dish_id,
                "dish_name": dish.dish_name,
                "cooking_time": dish.cooking_time,
                "ration": dish.ration,
                "image": HomeService.build_image_url(request, dish),
                "category_name": dish.category_name,
                "category_label": HomeService.get_category_label(dish.category_name),
                "is_favorite": relation.is_favorite if relation else False,
                "source_dish_id": dish.source_dish_id,
            })

        return {
            "user": {
                "username": user.username,
            },
            "categories": HomeService.get_categories(),
            "dishes": dishes,
        }
    
    @staticmethod
    def apply_dish_search(queryset, search: str):
        keyword = (search or "").strip()
        if not keyword:
            return queryset

        return queryset.filter(
            Q(dish_name__icontains=keyword) |
            Q(dish_details__ingredient__ingredient_name__icontains=keyword)
        ).distinct()

    @staticmethod
    def _get_or_create_ingredient(ingredient_data):
        ingredient_name = ingredient_data["ingredient_name"].strip()

        ingredient, _ = Ingredient.objects.get_or_create(
            ingredient_name=ingredient_name,
            defaults={
                "group_name": ingredient_data["group_name"],
                "category": ingredient_data["category"],
            },
        )
        return ingredient


    @staticmethod
    def _replace_dish_details_and_methods(dish, ingredients_data, methods_data):
        dish.dish_details.all().delete()
        dish.methods.all().delete()

        for ingredient_data in ingredients_data:
            ingredient = HomeService._get_or_create_ingredient(ingredient_data)

            DishDetail.objects.create(
                dish=dish,
                ingredient=ingredient,
                quantity=ingredient_data["quantity"],
                unit=ingredient_data["unit"].strip(),
            )

        for index, method_data in enumerate(methods_data, start=1):
            DishMethod.objects.create(
                dish=dish,
                step_number=method_data.get("step_number") or index,
                instruction=method_data["instruction"].strip(),
            )

    @staticmethod
    def create_individual_dish(request, user, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        methods_data = validated_data.pop("methods", [])
        image = validated_data.pop("image", None)

        with transaction.atomic():
            dish = Dish.objects.create(
                dish_name=validated_data["dish_name"].strip(),
                cooking_time=validated_data["cooking_time"],
                ration=validated_data["ration"],
                calories=validated_data.get("calories"),
                category_name=validated_data["category_name"],
                image=image,
                is_system=False,
                source_dish=None,
            )

            HomeService._replace_dish_details_and_methods(
                dish=dish,
                ingredients_data=ingredients_data,
                methods_data=methods_data,
            )

            IndividualDish.objects.create(
                user=user,
                dish=dish,
                is_favorite=False,
            )

        return {
            "success": True,
            "message": "Thêm món ăn thành công",
            "data": {
                "dish_id": dish.dish_id,
                "dish_name": dish.dish_name,
                "image": HomeService.build_image_url(request, dish),
                "is_system": dish.is_system,
                "source_dish_id": dish.source_dish_id,
            },
        }

    @staticmethod
    def _get_individual_relation(user, dish_id, prefetch=False):
        queryset = (
            IndividualDish.objects
            .select_related("dish")
            .filter(
                user=user,
                dish__dish_id=dish_id,
                dish__is_system=False,
            )
        )

        if prefetch:
            queryset = queryset.prefetch_related(
                "dish__dish_details__ingredient",
                "dish__methods",
            )

        return queryset.first()

    @staticmethod
    def _build_individual_form_data(request, relation):
        dish = relation.dish

        ingredients = [
            {
                "ingredient_name": detail.ingredient.ingredient_name,
                "quantity": detail.quantity,
                "unit": detail.unit,
                "group_name": detail.ingredient.group_name,
                "category": detail.ingredient.category,
            }
            for detail in dish.dish_details.all()
        ]

        methods = [
            {
                "step_number": method.step_number,
                "instruction": method.instruction,
            }
            for method in dish.methods.all().order_by("step_number")
        ]

        return {
            "dish_id": dish.dish_id,
            "dish_name": dish.dish_name,
            "cooking_time": dish.cooking_time,
            "ration": dish.ration,
            "calories": dish.calories,
            "image": HomeService.build_image_url(request, dish),
            "category_name": dish.category_name,
            "is_favorite": relation.is_favorite,
            "source_dish_id": dish.source_dish_id,
            "ingredients": ingredients,
            "methods": methods,
        }

    @staticmethod
    def get_individual_dish_for_update(request, user, dish_id):
        relation = HomeService._get_individual_relation(
            user=user,
            dish_id=dish_id,
            prefetch=True,
        )

        if not relation:
            return {
                "success": False,
                "message": "Không tìm thấy món ăn cá nhân",
                "data": None,
            }

        return {
            "success": True,
            "message": "Lấy dữ liệu món ăn thành công",
            "data": HomeService._build_individual_form_data(request, relation),
        }

    @staticmethod
    def update_individual_dish(request, user, dish_id, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        methods_data = validated_data.pop("methods", [])
        image = validated_data.pop("image", None)

        relation = HomeService._get_individual_relation(
            user=user,
            dish_id=dish_id,
            prefetch=False,
        )

        if not relation:
            return {
                "success": False,
                "message": "Không tìm thấy món ăn cá nhân",
                "data": None,
            }

        dish = relation.dish

        with transaction.atomic():
            dish.dish_name = validated_data["dish_name"].strip()
            dish.cooking_time = validated_data["cooking_time"]
            dish.ration = validated_data["ration"]
            dish.calories = validated_data.get("calories")
            dish.category_name = validated_data["category_name"]

            if image is not None:
                dish.image = image

            dish.save()

            HomeService._replace_dish_details_and_methods(
                dish=dish,
                ingredients_data=ingredients_data,
                methods_data=methods_data,
            )

        return {
            "success": True,
            "message": "Cập nhật món ăn thành công",
            "data": HomeService._build_individual_form_data(request, relation),
        }



    @staticmethod
    def delete_individual_dish(user, dish_id):
        relation = (
            IndividualDish.objects
            .select_related("dish")
            .filter(
                user=user,
                dish_id=dish_id,
                dish__is_system=False,
            )
            .first()
        )

        if not relation:
            return {
                "success": False,
                "message": "Không tìm thấy món ăn cá nhân",
                "data": None,
            }

        with transaction.atomic():
            copied_dish = relation.dish
            source_dish_id = copied_dish.source_dish_id

            relation.delete()
            copied_dish.delete()

        return {
            "success": True,
            "message": "Xóa món ăn cá nhân thành công",
            "data": {
                "dish_id": dish_id,
                "source_dish_id": source_dish_id,
                "deleted": True,
            },
        }
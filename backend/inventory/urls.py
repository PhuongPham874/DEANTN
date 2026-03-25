from django.urls import path

from .views import (
    food_inventory_view,
    food_inventory_detail_view,
    food_inventory_create_view,
    food_inventory_update_view,
    food_inventory_delete_view,
    add_bought_items_to_inventory_view,
)

urlpatterns = [
    path("foods/", food_inventory_view, name="food-inventory-list"),
    path("foods/detail/", food_inventory_detail_view, name="food-inventory-detail"),
    path("foods/create/", food_inventory_create_view, name="food-inventory-create"),
    path("foods/update/", food_inventory_update_view, name="food-inventory-update"),
    path("foods/delete/", food_inventory_delete_view, name="food-inventory-delete"),
    path("foods/add-bought-items/", add_bought_items_to_inventory_view, name="food-inventory-add-bought-items"),
]
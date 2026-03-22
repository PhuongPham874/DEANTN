import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useMealPlanUI } from "@/src/hooks/useMealPlanUI";
import MealPlanHeader from "@/components/meal-plan/MealPlanHeader";
import MealPlanWeekTable from "@/components/meal-plan/MealPlanWeekTable";
import DishPickerModal from "@/components/meal-plan/DishPickerModal";
import CopyWeekModal from "@/components/meal-plan/CopyWeekModal";
import CopyDayModal from "@/components/meal-plan/CopyDayModal";
import DishDetailModal from "@/components/meal-plan/DishDetailModal";

export default function MealPlanScreen() {
  const {
    screenLoading,
    screenRefreshing,
    screenError,
    weekData,
    weekTitle,

    onRefresh,
    goToPreviousWeek,
    goToNextWeek,
    clearCurrentWeek,
    onPressDishDetail,
    confirmDeleteAssignedDish,
    confirmClearDayPlan,

    dishPickerVisible,
    dishPickerLoading,
    dishPickerError,
    dishSearch,
    availableDishes,
    assigningDishId,
    setDishSearch,
    submitDishSearch,
    openDishPicker,
    closeDishPicker,
    assignDish,

    copyWeekState,
    openCopyWeekModal,
    closeCopyWeekModal,
    loadCopyWeekOptions,
    setCopyWeekState,
    submitCopyWeek,

    copyDayState,
    openCopyDayModal,
    closeCopyDayModal,
    loadCopyDayOptions,
    setCopyDayState,
    submitCopyDay,

    detailModalVisible,
    selectedDishId,
    closeDishDetailModal,
  } = useMealPlanUI();

  if (screenLoading && !weekData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5D9625" />
      </SafeAreaView>
    );
  }

  if (screenError && !weekData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{screenError}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onRefresh}>
          <Text style={styles.primaryButtonText}>Tải lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handlePrevMonthInCopyWeek = () => {
    if (!copyWeekState.monthDate) return;

    const current = new Date(copyWeekState.monthDate);
    current.setMonth(current.getMonth() - 1);
    loadCopyWeekOptions(current.toISOString().slice(0, 10));
  };

  const handleNextMonthInCopyWeek = () => {
    if (!copyWeekState.monthDate) return;

    const current = new Date(copyWeekState.monthDate);
    current.setMonth(current.getMonth() + 1);
    loadCopyWeekOptions(current.toISOString().slice(0, 10));
  };

  const handlePrevWeekInCopyDay = () => {
    if (!copyDayState.weekDate) return;

    const current = new Date(copyDayState.weekDate);
    current.setDate(current.getDate() - 7);
    loadCopyDayOptions(current.toISOString().slice(0, 10));
  };

  const handleNextWeekInCopyDay = () => {
    if (!copyDayState.weekDate) return;

    const current = new Date(copyDayState.weekDate);
    current.setDate(current.getDate() + 7);
    loadCopyDayOptions(current.toISOString().slice(0, 10));
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[{ key: "meal-plan" }]}
        keyExtractor={(item) => item.key}
        refreshing={screenRefreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={() => (
          <>
            <MealPlanHeader
              styles={styles}
              weekTitle={weekTitle}
              onPreviousWeek={goToPreviousWeek}
              onNextWeek={goToNextWeek}
              onCopyWeek={openCopyWeekModal}
              onClearWeek={clearCurrentWeek}
            />

            <MealPlanWeekTable
              styles={styles}
              days={weekData?.days ?? []}
              onOpenDishPicker={openDishPicker}
              onPressDish={onPressDishDetail}
              onDeleteDish={confirmDeleteAssignedDish}
              onCopyDay={openCopyDayModal}
              onClearDay={confirmClearDayPlan}
            />
          </>
        )}
      />

      <DishPickerModal
        styles={styles}
        visible={dishPickerVisible}
        search={dishSearch}
        dishes={availableDishes}
        loading={dishPickerLoading}
        error={dishPickerError}
        assigningDishId={assigningDishId}
        onChangeSearch={setDishSearch}
        onSubmitSearch={submitDishSearch}
        onClose={closeDishPicker}
        onAssignDish={assignDish}
      />

      <CopyWeekModal
        styles={styles}
        visible={copyWeekState.visible}
        loading={copyWeekState.loading}
        sourceStartDate={copyWeekState.sourceStartDate}
        sourceEndDate={copyWeekState.sourceEndDate}
        monthRangeLabel={copyWeekState.monthRangeLabel}
        weeks={copyWeekState.weeks}
        selectedTargetStartDate={copyWeekState.selectedTargetStartDate}
        generalError={copyWeekState.generalError}
        targetError={copyWeekState.fieldErrors.target_start_date || ""}
        onClose={closeCopyWeekModal}
        onPrevMonth={handlePrevMonthInCopyWeek}
        onNextMonth={handleNextMonthInCopyWeek}
        onSelectWeek={(startDate) =>
          setCopyWeekState((prev) => ({
            ...prev,
            selectedTargetStartDate: startDate,
            fieldErrors: {
              ...prev.fieldErrors,
              target_start_date: "",
            },
          }))
        }
        onSubmit={submitCopyWeek}
      />

    <DishDetailModal
    visible={detailModalVisible}
    dishId={selectedDishId}
    onClose={closeDishDetailModal}
    />
      <CopyDayModal
        styles={styles}
        visible={copyDayState.visible}
        loading={copyDayState.loading}
        sourceDate={copyDayState.sourceDate}
        weekLabel={copyDayState.weekLabel}
        days={copyDayState.days}
        selectedTargetDate={copyDayState.selectedTargetDate}
        generalError={copyDayState.generalError}
        targetError={copyDayState.fieldErrors.target_date || ""}
        onClose={closeCopyDayModal}
        onPrevWeek={handlePrevWeekInCopyDay}
        onNextWeek={handleNextWeekInCopyDay}
        onSelectDate={(date) =>
          setCopyDayState((prev) => ({
            ...prev,
            selectedTargetDate: date,
            fieldErrors: {
              ...prev.fieldErrors,
              target_date: "",
            },
          }))
        }
        onSubmit={submitCopyDay}    
      />
    </SafeAreaView>
  );
}

const BORDER = "#D8D8D8";
const GREEN = "#5D9625";
const BG = "#EEF3ED";
const CARD = "#FFFFFF";
const RED = "#D95C5C";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  headerRow: {
    marginTop: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#669C2F",
    letterSpacing: 0.5,
  },

  weekSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F6F1",
  },
  weekTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#3E3E3E",
    marginHorizontal: 12,
  },

  topActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 8,
  },
  smallGreenButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: GREEN,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  smallRedButton: {
    flex: 1.25,
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: RED,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  headerCellText: {
    textAlign: "center",
    color: GREEN,
    fontWeight: "700",
    fontSize: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  dayColumn: {
    width: 70,
  },
  mealColumn: {
    flex: 1,
  },
  actionColumnSpacer: {
    width: 38,
  },

  rowBox: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FBFBFB",
    minHeight: 130,
  },
  dayCell: {
    width: 70,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  monthText: {
    color: "#6C9E35",
    fontSize: 10,
    fontWeight: "700",
  },
  dayNumber: {
    color: "#D9702A",
    fontSize: 13,
    fontWeight: "800",
    marginVertical: 2,
  },
  weekdayText: {
    color: "#6C9E35",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  mealCell: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderColor: BORDER,
    justifyContent: "flex-start",
    
  },
  mealCellList: {
    gap: 8,
  },

  emptySlotButton: {
    minHeight: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C9D1C5",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  emptySlotPlus: {
    color: GREEN,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 24,
  },

  assignedDishWrapper: {
    position: "relative",
  },
  assignedDishPill: {
    minHeight: 28,
    borderRadius: 8,
    backgroundColor: "#EFF5EA",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start', 
    width: '100%',
  },
  assignedDishText: {
    fontSize: 12,
    color: "#3E3E3E",
    fontWeight: "600",
    flexWrap: 'wrap',
  },
  assignedDishDelete: {
    position: "absolute",
    right: 4,
    top: 5,
  },

  actionColumn: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  iconBox: {
    width: 25,
    height: 25,
    borderRadius: 6,
    backgroundColor: "#E7EFE2",
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.20)",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  modalCardLarge: {
    backgroundColor: "#E6EEE5",
    borderRadius: 24,
    padding: 18,
    maxHeight: "88%",
  },
  modalCardMedium: {
    backgroundColor: "#E6EEE5",
    borderRadius: 24,
    padding: 18,
    maxHeight: "82%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    color: GREEN,
    fontSize: 18,
    fontWeight: "800",
  },

  searchBox: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: "#3E3E3E",
    paddingVertical: 10,
  },

  modalLoadingBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  modalListContent: {
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },

  dishCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dishImage: {
    width: 78,
    height: 78,
    borderRadius: 14,
    backgroundColor: "#D9D9D9",
  },
  dishContent: {
    flex: 1,
  },
  dishTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  dishName: {
    fontSize: 18,
    color: "#333333",
    fontWeight: "500",
    flexShrink: 1,
  },
  favoriteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F4F8F1",
    alignItems: "center",
    justifyContent: "center",
  },
  dishMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dishMetaText: {
    fontSize: 14,
    color: "#4D4D4D",
  },
  addDishButton: {
    minWidth: 78,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E6EEE5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  addDishButtonText: {
    color: GREEN,
    fontWeight: "800",
    fontSize: 16,
  },

  infoBox: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: "#6A6A6A",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 18,
    color: GREEN,
    fontWeight: "800",
  },

  sectionLabel: {
    fontSize: 16,
    color: "#5F5F5F",
    marginBottom: 10,
  },
  rangeSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rangeLabel: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
    color: "#3E3E3E",
    fontSize: 17,
    fontWeight: "700",
  },

  copyWeekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginBottom: 14,
  },
  copyTargetCard: {
    width: "47.5%",
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  copyTargetCardSelected: {
    backgroundColor: "#D7DAD7",
    borderWidth: 2,
    borderColor: "#C8CDC7",
  },
  copyTargetTitle: {
    color: "#73A13E",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  copyTargetValue: {
    color: "#DF4E4E",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  copyDayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginBottom: 14,
  },
  copyDayCard: {
    width: "30.5%",
    minHeight: 126,
    borderRadius: 16,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  copyDayMonth: {
    color: "#73A13E",
    fontSize: 14,
    fontWeight: "800",
  },
  copyDayNumber: {
    color: "#DF4E4E",
    fontSize: 20,
    fontWeight: "800",
    marginVertical: 4,
  },
  copyDayWeekday: {
    color: "#73A13E",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  primaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  fieldErrorText: {
    color: "#D84B4B",
    fontSize: 13,
    marginBottom: 10,
  },
  errorText: {
    color: "#D84B4B",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B6B6B",
    fontSize: 15,
    paddingVertical: 20,
  },
});
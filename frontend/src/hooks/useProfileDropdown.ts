import { useRef, useState } from "react";
import {
  Dimensions,
  TouchableOpacity,
  findNodeHandle,
  UIManager,
} from "react-native";

type MenuPosition = {
  top: number;
  left: number;
};

export function useProfileDropdown() {
  const profileButtonRef = useRef<
    React.ElementRef<typeof TouchableOpacity> | null
  >(null);

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });

  const openDropdown = () => {
    if (!profileButtonRef.current) return;

    const node = findNodeHandle(profileButtonRef.current);
    if (!node) return;

    UIManager.measureInWindow(
      node,
      (x: number, y: number, width: number, height: number) => {
        const screenWidth = Dimensions.get("window").width;
        const menuWidth = Math.min(screenWidth * 0.65, 260);

        // neo theo mép phải icon profile
        const horizontalOffset = 6;
        const calculatedLeft = x + width - menuWidth + horizontalOffset;

        const safeLeft = Math.max(
            12,
            Math.min(calculatedLeft, screenWidth - menuWidth - 12)
        );

        setPosition({
            top: y + height + 4,
            left: safeLeft,
        });

        setVisible(true);
        }
    );
  };

  const closeDropdown = () => {
    setVisible(false);
  };

  return {
    profileButtonRef,
    dropdownVisible: visible,
    dropdownPosition: position,
    openDropdown,
    closeDropdown,
  };
}
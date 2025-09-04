import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { safeHapticImpact } from '../utils/haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Disabled haptic feedback for web compatibility
        safeHapticImpact();
        props.onPressIn?.(ev);
      }}
    />
  );
}

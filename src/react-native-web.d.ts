import "react-native";

declare module "react-native" {
  interface PressableStateCallbackType {
    /** React Native Web supplies this state; native platforms omit it. */
    readonly hovered?: boolean;
  }
}

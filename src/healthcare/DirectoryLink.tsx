import React from "react";
import {
  Platform,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { T, colors } from "../ui";
import { useHealthcare } from "./client";
import { directoryPath, type DirectoryRoute } from "./navigation";

export function DirectoryLink({
  route,
  label,
  children,
  style,
}: {
  route: DirectoryRoute;
  label: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { go } = useHealthcare();
  const content = children ?? (
    <T variant="small" style={{ color: colors.ink }}>
      {label}
    </T>
  );
  if (Platform.OS === "web")
    return (
      <View style={style}>
        {React.createElement(
          "a",
          {
            href: directoryPath(route),
            "aria-label": label,
            style: {
              display: "flex",
              alignItems: "center",
              minHeight: 44,
              textDecoration: "none",
              color: "inherit",
            },
            onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              go(route);
            },
          },
          content,
        )}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => go(route)}
      style={[{ minHeight: 44, justifyContent: "center" }, style]}
    >
      {content}
    </Pressable>
  );
}

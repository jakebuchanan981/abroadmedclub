import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Heart,
  Globe2,
  Users,
  CalendarDays,
  MessageCircle,
  UserRound,
  MapPin,
  Compass,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Leaf,
  Plane,
  Bookmark,
  LockKeyhole,
  Bell,
  CircleHelp,
  Trash2,
  Send,
  Coffee,
  CheckCircle2,
  Circle,
  Settings2,
  LogOut,
  Menu,
  Building2,
  HandHeart,
  Languages,
  Wallet,
  Info,
} from "lucide-react-native";

export const colors = {
  ink: "#263D35",
  teal: "#24594D",
  tealDark: "#173F35",
  cream: "#F8F7F2",
  muted: "#65756B",
  line: "#E1E5DC",
  white: "#FFFFFF",
  sage: "#ECF0E7",
  peach: "#F5E8DD",
  gold: "#B69360",
  red: "#AB403B",
};
export const fonts = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
  serif: "DMSerifDisplay_400Regular",
};
const icons = {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Heart,
  Globe2,
  Users,
  CalendarDays,
  MessageCircle,
  UserRound,
  MapPin,
  Compass,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Leaf,
  Plane,
  Bookmark,
  LockKeyhole,
  Bell,
  CircleHelp,
  Trash2,
  Send,
  Coffee,
  CheckCircle2,
  Circle,
  Settings2,
  LogOut,
  Menu,
  Building2,
  HandHeart,
  Languages,
  Wallet,
  Info,
};
export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 20,
  color = colors.ink,
  strokeWidth = 1.7,
  fill = "none",
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}) {
  const Component = icons[name];
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={fill}
      aria-hidden
    />
  );
}

type TextVariant = "body" | "small" | "label" | "h1" | "h2" | "h3" | "eyebrow";
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type TProps = TextProps & {
  variant?: TextVariant;
  headingLevel?: HeadingLevel;
};
const WebText = Text as React.ComponentType<
  TextProps & { "aria-level"?: HeadingLevel }
>;
const headingLevelByVariant: Record<TextVariant, HeadingLevel | undefined> = {
  body: undefined,
  small: undefined,
  label: undefined,
  h1: 1,
  h2: 2,
  h3: 3,
  eyebrow: undefined,
};

export function T({
  children,
  variant = "body",
  style,
  headingLevel,
  ...props
}: TProps) {
  const effectiveRole = props.role ?? props.accessibilityRole;

  return (
    <WebText
      {...props}
      aria-level={
        Platform.OS === "web" &&
        (effectiveRole === "heading" || effectiveRole === "header")
          ? (headingLevel ?? headingLevelByVariant[variant])
          : undefined
      }
      style={[textStyles.base, textStyles[variant], style]}
    >
      {children}
    </WebText>
  );
}
const textStyles = StyleSheet.create({
  base: { color: colors.ink, fontFamily: fonts.regular },
  body: { fontSize: 15, lineHeight: 24 },
  small: { fontSize: 12, lineHeight: 19, color: colors.muted },
  label: { fontSize: 14, lineHeight: 21, fontFamily: fonts.semibold },
  h1: {
    fontSize: 48,
    lineHeight: 55,
    fontFamily: fonts.serif,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.serif,
    letterSpacing: -0.5,
  },
  h3: { fontSize: 22, lineHeight: 29, fontFamily: fonts.serif },
  eyebrow: {
    fontSize: 11,
    lineHeight: 18,
    fontFamily: fonts.bold,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  small = false,
  disabled = false,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost";
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        variant === "primary"
          ? styles.primary
          : variant === "secondary"
            ? styles.secondary
            : styles.ghost,
        small && { minHeight: 44, paddingHorizontal: 16 },
        hovered && { opacity: 0.86 },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <T
        variant="label"
        style={{
          color: variant === "primary" ? colors.white : colors.teal,
          fontSize: small ? 13 : 14,
        }}
      >
        {label}
      </T>
      {icon && (
        <Icon
          name={icon}
          size={small ? 16 : 18}
          color={variant === "primary" ? colors.white : colors.teal}
        />
      )}
    </Pressable>
  );
}

export function Choice({
  role,
  checked,
  disabled = false,
  onPress,
  ...props
}: Omit<
  PressableProps,
  | "role"
  | "accessibilityRole"
  | "accessibilityState"
  | "aria-checked"
  | "aria-disabled"
  | "onPress"
> & {
  role: "checkbox" | "radio";
  checked: boolean;
  onPress: () => void;
}) {
  // React Native Web's Pressable handles Space for buttons, but not checkable roles.
  const keyboardProps =
    Platform.OS === "web"
      ? {
          onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
            if (event.key !== " ") return;
            event.preventDefault();
            if (!disabled && !event.repeat) onPress();
          },
        }
      : undefined;
  return (
    <Pressable
      {...props}
      {...keyboardProps}
      accessibilityRole={role}
      aria-checked={checked}
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={onPress}
    />
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={active}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.chip,
        active && { backgroundColor: colors.teal, borderColor: colors.teal },
        hovered && !active && { backgroundColor: colors.sage },
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          color={active ? colors.white : colors.muted}
        />
      )}
      <T
        variant="label"
        style={{ fontSize: 12, color: active ? colors.white : colors.muted }}
      >
        {label}
      </T>
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Page({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[styles.page, { paddingHorizontal: width < 700 ? 20 : 48 }, style]}
    >
      {children}
    </View>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ gap: 15, marginBottom: 32 }}>
      <T variant="eyebrow" style={{ color: colors.teal }}>
        {eyebrow}
      </T>
      <View
        style={{
          flexDirection: width < 700 ? "column" : "row",
          justifyContent: "space-between",
          gap: 20,
          alignItems: width < 700 ? "flex-start" : "center",
        }}
      >
        <View style={{ flex: 1, gap: 10 }}>
          <T
            accessibilityRole="header"
            variant="h1"
            style={width < 700 && { fontSize: 37, lineHeight: 44 }}
          >
            {title}
          </T>
          <T style={{ color: colors.muted, maxWidth: 650 }}>{description}</T>
        </View>
        {action}
      </View>
    </View>
  );
}

export function SectionTitle({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 22,
      }}
    >
      <View style={{ flexShrink: 1, gap: 4 }}>
        <T accessibilityRole="header" variant="h2">
          {title}
        </T>
        {description && (
          <T style={{ color: colors.muted, fontSize: 14 }}>{description}</T>
        )}
      </View>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="ghost"
          icon="ArrowRight"
          small
        />
      )}
    </View>
  );
}

export function TextField({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <T variant="label">{label}</T>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#7D8A80"
        style={[
          styles.input,
          props.multiline && {
            minHeight: 112,
            paddingTop: 12,
            textAlignVertical: "top",
          },
          style,
        ]}
      />
    </View>
  );
}

const avatarColors = ["#DDD9C6", "#D8E6DF", "#E9D6CB", "#DCDDEC"];
export function Avatar({
  initials,
  size = 38,
  index = 0,
}: {
  initials: string;
  size?: number;
  index?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColors[index % avatarColors.length],
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.cream,
      }}
    >
      <T style={{ fontFamily: fonts.semibold, fontSize: size * 0.3 }}>
        {initials}
      </T>
    </View>
  );
}
export function AvatarStack({
  initials,
  label,
}: {
  initials: string[];
  label?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flexDirection: "row", paddingLeft: 5 }}>
        {initials.map((value, index) => (
          <View key={`${value}-${index}`} style={{ marginLeft: -5 }}>
            <Avatar initials={value} index={index} size={31} />
          </View>
        ))}
      </View>
      {label && <T variant="small">{label}</T>}
    </View>
  );
}

export function Notice({
  children,
  icon = "Info",
}: {
  children: React.ReactNode;
  icon?: IconName;
}) {
  return (
    <View style={styles.notice}>
      <Icon name={icon} size={18} color={colors.teal} />
      <T variant="small" style={{ flex: 1, color: colors.ink }}>
        {children}
      </T>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card
      style={{
        alignItems: "center",
        paddingVertical: 52,
        paddingHorizontal: 24,
        gap: 16,
      }}
    >
      <View style={styles.iconCircle}>
        <Icon name={icon} size={28} color={colors.teal} />
      </View>
      <T variant="h3" style={{ textAlign: "center" }}>
        {title}
      </T>
      <T style={{ textAlign: "center", color: colors.muted, maxWidth: 460 }}>
        {body}
      </T>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} icon="ArrowRight" />
      )}
    </Card>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { maxHeight: height * 0.9, width: Math.min(width - 24, 650) },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, gap: 5 }}>
              <T accessibilityRole="header" variant="h2">
                {title}
              </T>
              {subtitle && <T variant="small">{subtitle}</T>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={onClose}
              style={styles.close}
            >
              <Icon name="X" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: width < 600 ? 20 : 28, gap: 22 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 49,
    paddingHorizontal: 21,
    borderRadius: 9,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.teal, borderColor: colors.teal },
  secondary: { backgroundColor: "transparent", borderColor: "#C6D0C2" },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    paddingHorizontal: 3,
  },
  chip: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    overflow: "hidden",
  },
  page: {
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
    paddingTop: 38,
    paddingBottom: 52,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CDD5CA",
    borderRadius: 9,
    backgroundColor: colors.white,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  notice: {
    backgroundColor: colors.sage,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 36, 29, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0px 16px 60px rgba(17, 36, 29, 0.2)",
  },
  sheetHeader: {
    padding: 23,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  close: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "@/constants/theme";

export function Screen({
  children,
  scroll = true,
  contentContainerStyle
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
}) {
  if (!scroll) {
    return <View style={[styles.screen, contentContainerStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function HeroCard({
  title,
  subtitle,
  rightLabel
}: {
  title: string;
  subtitle: string;
  rightLabel?: string;
}) {
  return (
    <LinearGradient colors={["#16334C", "#13273C", "#102132"]} style={styles.heroCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.heroEyebrow}>ORIN ADMIN</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
      {rightLabel ? (
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>{rightLabel}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatGrid({
  items
}: {
  items: Array<{ label: string; value: string | number; tone?: "primary" | "accent" | "warning" | "danger" }>;
}) {
  return (
    <View style={styles.statGrid}>
      {items.map((item) => {
        const tone =
          item.tone === "accent"
            ? colors.accent
            : item.tone === "warning"
              ? colors.warning
              : item.tone === "danger"
                ? colors.danger
                : colors.primary;

        return (
          <View key={item.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: tone }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Value({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.value, muted ? styles.muted : null]}>{children}</Text>;
}

export function ChipTabs<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active ? styles.chipActive : null]}
          >
            <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  tone = "default",
  disabled = false
}: {
  label: string;
  onPress: () => void;
  tone?: "default" | "primary" | "danger" | "warning";
  disabled?: boolean;
}) {
  const toneStyle =
    tone === "primary"
      ? styles.buttonPrimary
      : tone === "danger"
        ? styles.buttonDanger
        : tone === "warning"
          ? styles.buttonWarning
          : styles.buttonDefault;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, toneStyle, disabled ? styles.buttonDisabled : null]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </Card>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  helperText,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  helperText?: string;
} & TextInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        {...rest}
      />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: 120
  },
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(95,168,255,0.22)",
    marginBottom: spacing.lg,
    flexDirection: "row",
    gap: spacing.md
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 8
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(73,209,141,0.14)",
    borderColor: "rgba(73,209,141,0.35)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999
  },
  heroPillText: {
    color: colors.primary,
    fontWeight: "700"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  sectionSubtitle: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  statCard: {
    minWidth: "47%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.border,
    borderWidth: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800"
  },
  statLabel: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4
  },
  value: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  muted: {
    color: colors.textMuted
  },
  fieldWrap: {
    marginBottom: spacing.md
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  chip: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },
  chipActive: {
    backgroundColor: "rgba(73,209,141,0.14)",
    borderColor: colors.primary
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: "700"
  },
  chipTextActive: {
    color: colors.primary
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 112
  },
  buttonDefault: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border
  },
  buttonPrimary: {
    backgroundColor: colors.primaryDeep,
    borderWidth: 1,
    borderColor: colors.primary
  },
  buttonDanger: {
    backgroundColor: "rgba(255,106,106,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,106,106,0.42)"
  },
  buttonWarning: {
    backgroundColor: "rgba(245,158,11,0.14)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.42)"
  },
  buttonDisabled: {
    opacity: 0.45
  },
  buttonText: {
    color: colors.text,
    fontWeight: "700"
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6
  },
  emptySubtitle: {
    color: colors.textMuted,
    lineHeight: 21
  },
  loadingWrap: {
    flex: 1,
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg
  },
  loadingText: {
    color: colors.textMuted
  }
});

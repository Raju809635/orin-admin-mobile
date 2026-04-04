import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/constants/theme";

type DrawerItem = {
  label: string;
  subtitle: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const primaryItems: DrawerItem[] = [
  { label: "Overview", subtitle: "Platform pulse and quick actions", path: "/overview", icon: "grid" },
  { label: "Operations", subtitle: "Approvals, complaints, collaborations", path: "/operations", icon: "flash" },
  { label: "Mentorship", subtitle: "Mentors, sessions, payouts", path: "/mentorship", icon: "school" },
  { label: "Community", subtitle: "Feed, challenges, sprints", path: "/community", icon: "people" },
  { label: "More", subtitle: "Notifications, security, settings", path: "/more", icon: "menu" }
];

const utilityItems: DrawerItem[] = [
  { label: "Mentors", subtitle: "Browse mentor profiles and live controls", path: "/mentorship", icon: "ribbon" },
  { label: "Students", subtitle: "Browse all registered students", path: "/students", icon: "person-circle" },
  { label: "Payments", subtitle: "Manual proofs and payout queues", path: "/payments", icon: "wallet" },
  { label: "Programs", subtitle: "Live sessions and sprint review", path: "/programs", icon: "layers" },
  { label: "Platform", subtitle: "Banners, opportunities, resources, certifications, bootcamps", path: "/platform", icon: "albums" },
  { label: "Network", subtitle: "Connections, follows, mentor groups, audit logs", path: "/network", icon: "git-network" }
];

export function AdminTopBar({ title = "ORIN Admin" }: { title?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>ORIN CONTROL</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Pressable onPress={() => setVisible(true)} style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.drawer}>
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Admin Control Center</Text>
                <Text style={styles.drawerSubtitle}>Keep the bottom nav simple. Open deeper control sections from here.</Text>
              </View>

              <Text style={styles.groupLabel}>Main sections</Text>
              {primaryItems.map((item) => {
                const active = pathname === item.path;
                return (
                  <Pressable
                    key={item.path}
                    style={[styles.drawerItem, active ? styles.drawerItemActive : null]}
                    onPress={() => {
                      setVisible(false);
                      router.push(item.path as any);
                    }}
                  >
                    <View style={styles.drawerIconWrap}>
                      <Ionicons name={item.icon} size={20} color={active ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.drawerItemTitle, active ? styles.drawerItemTitleActive : null]}>{item.label}</Text>
                      <Text style={styles.drawerItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Text style={styles.groupLabel}>Deeper controls</Text>
              {utilityItems.map((item) => {
                const active = pathname === item.path;
                return (
                  <Pressable
                    key={item.path}
                    style={[styles.drawerItem, active ? styles.drawerItemActive : null]}
                    onPress={() => {
                      setVisible(false);
                      router.push(item.path as any);
                    }}
                  >
                    <View style={styles.drawerIconWrap}>
                      <Ionicons name={item.icon} size={20} color={active ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.drawerItemTitle, active ? styles.drawerItemTitleActive : null]}>{item.label}</Text>
                      <Text style={styles.drawerItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)"
  },
  drawer: {
    width: "82%",
    maxWidth: 360,
    backgroundColor: colors.bgSoft,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: -4, height: 0 },
    elevation: 18
  },
  drawerScroll: {
    flex: 1
  },
  drawerScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl
  },
  drawerHeader: {
    marginBottom: spacing.lg
  },
  drawerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  drawerSubtitle: {
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20
  },
  groupLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: spacing.sm,
    marginTop: spacing.md
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  drawerItemActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(73,209,141,0.12)"
  },
  drawerIconWrap: {
    width: 34,
    alignItems: "center"
  },
  drawerItemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  drawerItemTitleActive: {
    color: colors.primary
  },
  drawerItemSubtitle: {
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18
  }
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useWallet } from '../hooks/useWallet';

function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { walletAddress, balance, disconnect } = useWallet();

  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const avatarUri = walletAddress
    ? `https://api.multiavatar.com/${walletAddress}.png`
    : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.avatarRow}>
            {avatarUri ? (
              <Image style={styles.avatar} source={{ uri: avatarUri }} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarFallback}>👤</Text>
              </View>
            )}
            <View style={styles.walletInfo}>
              <Text style={styles.observerLabel}>Human Observer</Text>
              <Text style={styles.walletText}>{shortWallet}</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <View style={styles.balancePill}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
              <Text style={styles.balanceText}>{balance.toFixed(2)} SKR</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>0</Text></View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Bookmarks')}>
            <Text style={styles.menuIcon}>🔖</Text>
            <Text style={styles.menuText}>Bookmarks</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FollowingList')}>
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={styles.menuText}>Following</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TipHistory')}>
            <Text style={[styles.menuIcon, { fontSize: 18 }]}>⚡</Text>
            <Text style={styles.menuText}>Tip History</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Card */}
        <TouchableOpacity style={styles.proCard} onPress={() => navigation.navigate('ProUpgrade')} activeOpacity={0.9}>
          <View style={styles.proRow}>
            <View>
              <Text style={styles.proTitle}>ClawdFeed Pro</Text>
              <Text style={styles.proSubtitle}>DMs, priority access, & more</Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>🏆 $9.99/mo</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Disconnect */}
        <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
          <Text style={styles.disconnectText}>🚪 Disconnect Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  walletCard: { margin: 16, padding: 20, backgroundColor: '#16181C', borderRadius: 16, borderWidth: 1, borderColor: '#2F3336' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2F3336' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarFallback: { fontSize: 24 },
  walletInfo: { flex: 1 },
  observerLabel: { color: '#00D4FF', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  walletText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  balanceRow: { flexDirection: 'row' },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  balanceText: { color: '#FFD700', fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { color: '#8B98A5', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
  menuIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  menuText: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  chevron: { color: '#8B98A5', fontSize: 22, fontWeight: '300' },
  badge: { backgroundColor: '#2F3336', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#8B98A5', fontSize: 12, fontWeight: '600' },
  proCard: { margin: 16, padding: 16, backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  proRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proTitle: { color: '#FFD700', fontSize: 17, fontWeight: '700' },
  proSubtitle: { color: '#8B98A5', fontSize: 13, marginTop: 2 },
  proBadge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  proBadgeText: { color: '#000', fontSize: 13, fontWeight: '700' },
  disconnectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)' },
  disconnectText: { color: '#FF4444', fontSize: 15, fontWeight: '600' },
});

export default ProfileScreen;

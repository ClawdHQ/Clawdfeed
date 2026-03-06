import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../hooks/useWallet';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

const PREF_KEYS = {
  notifyLike: '@prefs:notifyLike',
  notifyRepost: '@prefs:notifyRepost',
  notifyFollow: '@prefs:notifyFollow',
  notifyTip: '@prefs:notifyTip',
  notifyDm: '@prefs:notifyDm',
};

function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { disconnect } = useWallet();

  const [notifyLike, setNotifyLike] = useState(true);
  const [notifyRepost, setNotifyRepost] = useState(true);
  const [notifyFollow, setNotifyFollow] = useState(true);
  const [notifyTip, setNotifyTip] = useState(true);
  const [notifyDm, setNotifyDm] = useState(true);

  const togglePref = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const handleLogout = async () => {
    await disconnect();
    navigation.replace('Onboarding');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        {[
          { label: 'Likes', value: notifyLike, key: PREF_KEYS.notifyLike, setter: setNotifyLike },
          { label: 'Reposts', value: notifyRepost, key: PREF_KEYS.notifyRepost, setter: setNotifyRepost },
          { label: 'Follows', value: notifyFollow, key: PREF_KEYS.notifyFollow, setter: setNotifyFollow },
          { label: 'Tips', value: notifyTip, key: PREF_KEYS.notifyTip, setter: setNotifyTip },
          { label: 'Direct Messages', value: notifyDm, key: PREF_KEYS.notifyDm, setter: setNotifyDm },
        ].map(({ label, value, key, setter }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Switch
              value={value}
              onValueChange={(v) => togglePref(key, v, setter)}
              trackColor={{ false: colors.gridGray, true: colors.electricCyan }}
              thumbColor={colors.textWhite}
            />
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <Text style={styles.aboutText}>ClawdFeed Mobile v0.0.1</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.voidBlack,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.gridGray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.voidBlack}55`,
  },
  rowLabel: {
    color: colors.textWhite,
    fontSize: fontSizes.body,
  },
  aboutText: {
    color: colors.textDim,
    fontSize: fontSizes.body,
    padding: 16,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.neonPink,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: colors.neonPink,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});

export default SettingsScreen;

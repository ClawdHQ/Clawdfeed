import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import PaymentModal from '../components/PaymentModal';

const PLATFORM_WALLET = 'A7wLLsSJczNif6Rbf8WqiH2qJJ8Y65sWyBHF65RQziN3';

const FEATURES = [
    { emoji: '💬', text: 'Direct messages with AI agents' },
    { emoji: '⚡', text: 'Priority agent responses' },
    { emoji: '⭐', text: 'Pro badge on your profile' },
    { emoji: '📈', text: 'Early access to trending content' },
    { emoji: '🛡️', text: 'Ad-free experience' },
    { emoji: '🎁', text: 'Exclusive $SKR rewards' },
];

function ProUpgradeScreen() {
    const [paymentVisible, setPaymentVisible] = useState(false);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <View style={styles.crownCircle}>
                        <Text style={{ fontSize: 36 }}>🏆</Text>
                    </View>
                    <Text style={styles.heroTitle}>Upgrade to Pro</Text>
                    <Text style={styles.heroPrice}>$9.99<Text style={styles.perMonth}>/month</Text></Text>
                    <Text style={styles.heroSubtitle}>Paid in $SKR (Solana Seeker)</Text>
                </View>

                <View style={styles.featuresCard}>
                    <Text style={styles.featuresTitle}>Everything in Pro</Text>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <Text style={styles.featureEmoji}>{f.emoji}</Text>
                            <Text style={styles.featureText}>{f.text}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.subscribeButton} onPress={() => setPaymentVisible(true)} activeOpacity={0.9}>
                    <Text style={styles.subscribeText}>⚡ Subscribe Now</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Payment is processed as a $SKR token transfer to the ClawdFeed platform wallet. Cancel anytime. Non-refundable.
                </Text>
            </ScrollView>

            <PaymentModal
                visible={paymentVisible}
                title="ClawdFeed Pro"
                description="Monthly subscription for DMs, priority access, and exclusive features."
                amountUsd={9.99}
                recipientWallet={PLATFORM_WALLET}
                recipientLabel="ClawdFeed Platform"
                onSuccess={(tx) => {
                    console.log('Pro subscription TX:', tx);
                }}
                onClose={() => setPaymentVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    content: { padding: 20 },
    heroSection: { alignItems: 'center', paddingVertical: 32 },
    crownCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 8 },
    heroPrice: { color: '#FFD700', fontSize: 36, fontWeight: '800' },
    perMonth: { fontSize: 16, fontWeight: '400', color: '#8B98A5' },
    heroSubtitle: { color: '#8B98A5', fontSize: 14, marginTop: 4 },
    featuresCard: { backgroundColor: '#16181C', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#2F3336' },
    featuresTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    featureEmoji: { fontSize: 18 },
    featureText: { color: '#E7E9EA', fontSize: 15 },
    subscribeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 999, marginBottom: 16 },
    subscribeText: { color: '#000', fontSize: 17, fontWeight: '800' },
    disclaimer: { color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

export default ProUpgradeScreen;

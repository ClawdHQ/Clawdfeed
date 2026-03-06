import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import PaymentModal from './PaymentModal';
import type { Agent } from '../types';

interface TipModalProps {
  visible: boolean;
  agent: Agent | null;
  onClose: () => void;
}

const PRESETS = [1, 5, 10, 20];

export default function TipModal({ visible, agent, onClose }: TipModalProps) {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentVisible, setPaymentVisible] = useState(false);

  const ownerWallet = agent?.owner?.wallet_address;
  const selectedAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleTip = useCallback(() => {
    if (!ownerWallet || selectedAmount <= 0) return;
    setPaymentVisible(true);
  }, [ownerWallet, selectedAmount]);

  if (!agent) return null;

  return (
    <>
      <Modal visible={visible && !paymentVisible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.agentRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{agent.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentHandle}>@{agent.handle}</Text>
              </View>
            </View>

            <Text style={styles.splitInfo}>
              💯 100% of your tip goes directly to the agent owner's wallet in $SKR
            </Text>

            {!ownerWallet && (
              <View style={styles.warningBox}>
                <Text style={styles.warningEmoji}>⚠️</Text>
                <Text style={styles.warningText}>This agent hasn't linked a wallet yet. Tips are unavailable.</Text>
              </View>
            )}

            {/* Presets */}
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetBtn, amount === p && !customAmount && styles.presetActive]}
                  onPress={() => { setAmount(p); setCustomAmount(''); }}
                >
                  <Text style={[styles.presetText, amount === p && !customAmount && styles.presetTextActive]}>${p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom */}
            <View style={styles.customRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.customInput}
                placeholder="Custom amount"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(v) => setCustomAmount(v.replace(/[^0-9.]/g, ''))}
              />
            </View>

            <TouchableOpacity
              style={[styles.tipBtn, (!ownerWallet || selectedAmount <= 0) && styles.tipBtnDisabled]}
              onPress={handleTip}
              disabled={!ownerWallet || selectedAmount <= 0}
              activeOpacity={0.9}
            >
              <Text style={styles.tipBtnText}>
                ⚡ Tip ${selectedAmount.toFixed(2)} in $SKR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              Tips are sent in $SKR on Solana. 100% goes to the agent owner. Non-refundable.
            </Text>
          </View>
        </View>
      </Modal>

      {ownerWallet && (
        <PaymentModal
          visible={paymentVisible}
          title={`Tip ${agent.name}`}
          description={`Send $${selectedAmount.toFixed(2)} worth of $SKR directly to @${agent.handle}'s owner.`}
          amountUsd={selectedAmount}
          recipientWallet={ownerWallet}
          recipientLabel={`@${agent.handle} owner`}
          onSuccess={(tx) => {
            console.log('Tip TX:', tx);
            setPaymentVisible(false);
            onClose();
          }}
          onClose={() => setPaymentVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#16181C', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#2F3336' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2F3336', alignSelf: 'center', marginBottom: 16 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1, padding: 4 },
  closeBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2F3336', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  agentName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  agentHandle: { color: '#8B98A5', fontSize: 13 },
  splitInfo: { color: '#8B98A5', fontSize: 13, lineHeight: 20, marginBottom: 16, paddingHorizontal: 8, backgroundColor: 'rgba(255,215,0,0.05)', borderRadius: 8, paddingVertical: 10 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,107,53,0.1)', borderRadius: 8, padding: 12, marginBottom: 16 },
  warningEmoji: { fontSize: 16 },
  warningText: { color: '#FF6B35', fontSize: 13, flex: 1 },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  presetBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2F3336', alignItems: 'center' },
  presetActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' },
  presetText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  presetTextActive: { color: '#FFD700' },
  customRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2F3336' },
  dollarSign: { color: '#8B98A5', fontSize: 18, marginRight: 8 },
  customInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 12 },
  tipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 999, marginBottom: 8 },
  tipBtnDisabled: { backgroundColor: '#2F3336' },
  tipBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  cancelBtn: { paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: '#8B98A5', alignItems: 'center', backgroundColor: 'rgba(139,152,165,0.12)', marginBottom: 12 },
  cancelBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footer: { color: '#6B7280', fontSize: 11, textAlign: 'center' },
});

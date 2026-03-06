import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { walletService } from '../services/wallet';
import { useAuthStore } from '../store/authStore';

interface PaymentModalProps {
    visible: boolean;
    title: string;
    description: string;
    amountUsd: number;
    recipientWallet: string;
    recipientLabel: string;
    onSuccess: (txSignature: string) => void;
    onClose: () => void;
}

type PayState = 'confirm' | 'checking' | 'insufficient' | 'signing' | 'success' | 'error';

const SKR_PRICE_USD = 0.035;

export default function PaymentModal({
    visible, title, description, amountUsd, recipientWallet, recipientLabel, onSuccess, onClose,
}: PaymentModalProps) {
    const [state, setState] = useState<PayState>('confirm');
    const [balance, setBalance] = useState<number>(0);
    const [error, setError] = useState('');
    const [txSig, setTxSig] = useState('');

    const skrAmount = amountUsd / SKR_PRICE_USD;

    useEffect(() => {
        if (visible) {
            setState('checking');
            setError('');
            setTxSig('');
            walletService.getBalance()
                .then((bal) => {
                    setBalance(bal);
                    setState(bal < skrAmount ? 'insufficient' : 'confirm');
                })
                .catch(() => {
                    setBalance(0);
                    setState('confirm');
                });
        }
    }, [visible, skrAmount]);

    const handlePay = useCallback(async () => {
        setState('signing');
        try {
            const signature = await walletService.sendTip(recipientWallet, skrAmount);
            setTxSig(signature);
            setState('success');
            onSuccess(signature);
        } catch (err: any) {
            setError(err.message || 'Transaction failed');
            setState('error');
        }
    }, [recipientWallet, skrAmount, onSuccess]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>

                    {/* Checking balance */}
                    {state === 'checking' && (
                        <View style={styles.center}>
                            <ActivityIndicator color="#00D4FF" size="large" />
                            <Text style={styles.stateText}>Checking $SKR balance...</Text>
                        </View>
                    )}

                    {/* Insufficient balance */}
                    {state === 'insufficient' && (
                        <View style={styles.center}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.iconEmoji}>⚠️</Text>
                            </View>
                            <Text style={styles.title}>Insufficient Balance</Text>
                            <Text style={styles.desc}>
                                You need {skrAmount.toFixed(2)} SKR but only have {balance.toFixed(2)} SKR.
                            </Text>
                            <Text style={styles.hint}>Buy $SKR on Jupiter or Raydium to continue.</Text>
                            <TouchableOpacity style={styles.btnOutline} onPress={onClose}>
                                <Text style={styles.btnOutlineText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Confirm */}
                    {state === 'confirm' && (
                        <View style={styles.center}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.iconEmoji}>⚡</Text>
                            </View>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.desc}>{description}</Text>

                            <View style={styles.amountBox}>
                                <Text style={styles.amountLabel}>Amount</Text>
                                <Text style={styles.amountValue}>${amountUsd.toFixed(2)}</Text>
                                <Text style={styles.skrEquiv}>≈ {skrAmount.toFixed(2)} SKR</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>To</Text>
                                <Text style={styles.detailValue}>{recipientLabel}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Your Balance</Text>
                                <Text style={styles.detailValue}>{balance.toFixed(2)} SKR</Text>
                            </View>

                            <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.9}>
                                <Text style={styles.payBtnText}>⚡ Pay {skrAmount.toFixed(2)} SKR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnOutline} onPress={onClose}>
                                <Text style={styles.btnOutlineText}>Cancel</Text>
                            </TouchableOpacity>

                            <Text style={styles.disclaimer}>
                                On-chain Solana transaction. Non-refundable.
                            </Text>
                        </View>
                    )}

                    {/* Signing */}
                    {state === 'signing' && (
                        <View style={styles.center}>
                            <ActivityIndicator color="#FFD700" size="large" />
                            <Text style={styles.stateText}>Confirm in your wallet...</Text>
                            <Text style={styles.hint}>Approve the transaction in your Solana wallet app.</Text>
                        </View>
                    )}

                    {/* Success */}
                    {state === 'success' && (
                        <View style={styles.center}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0,212,255,0.1)' }]}>
                                <Text style={styles.iconEmoji}>✅</Text>
                            </View>
                            <Text style={styles.title}>Payment Successful!</Text>
                            <Text style={styles.desc}>{amountUsd.toFixed(2)} USD worth of $SKR sent.</Text>
                            {txSig ? (
                                <Text style={styles.txSig} numberOfLines={1}>TX: {txSig.slice(0, 20)}...</Text>
                            ) : null}
                            <TouchableOpacity style={styles.payBtn} onPress={onClose}>
                                <Text style={styles.payBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Error */}
                    {state === 'error' && (
                        <View style={styles.center}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,68,68,0.1)' }]}>
                                <Text style={styles.iconEmoji}>❌</Text>
                            </View>
                            <Text style={styles.title}>Transaction Failed</Text>
                            <Text style={styles.desc}>{error}</Text>
                            <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                                <Text style={styles.payBtnText}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnOutline} onPress={onClose}>
                                <Text style={styles.btnOutlineText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 380, backgroundColor: '#16181C', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2F3336' },
    closeBtn: { position: 'absolute', top: 12, right: 12, padding: 8, zIndex: 1 },
    closeBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    center: { alignItems: 'center', paddingTop: 8 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    iconEmoji: { fontSize: 32 },
    title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    desc: { color: '#8B98A5', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    hint: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 16 },
    stateText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 16 },
    amountBox: { backgroundColor: '#0A0A0A', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, width: '100%', borderWidth: 1, borderColor: '#2F3336' },
    amountLabel: { color: '#8B98A5', fontSize: 12, marginBottom: 4 },
    amountValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
    skrEquiv: { color: '#FFD700', fontSize: 14, fontWeight: '600', marginTop: 4 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    detailLabel: { color: '#8B98A5', fontSize: 13 },
    detailValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 999, width: '100%', marginTop: 16 },
    payBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
    btnOutline: { paddingVertical: 12, borderRadius: 999, width: '100%', marginTop: 8, borderWidth: 1.5, borderColor: '#8B98A5', alignItems: 'center', backgroundColor: 'rgba(139,152,165,0.12)' },
    btnOutlineText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    disclaimer: { color: '#6B7280', fontSize: 11, marginTop: 12, textAlign: 'center' },
    txSig: { color: '#00D4FF', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 },
});

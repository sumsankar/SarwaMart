import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { NEGOTIATION_THREAD } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Message = typeof NEGOTIATION_THREAD[number];

export const NegotiationScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const { role, selectedItem, selectedRequest } = useAppStore();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>(NEGOTIATION_THREAD as any);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dealDone, setDealDone] = useState(false);

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMessages(m => [...m, { type: 'bubble', from: 'seller', text: msg, time: 'Now' } as any]);
    setMsg('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Counterparty is anonymized — sellers see a Buyer #, buyers see a Seller #.
  const counterparty = (() => {
    if (role === 'seller') {
      if (selectedRequest?.buyer) return selectedRequest.buyer as string;
      const seed = selectedItem?.id ?? selectedRequest?.id ?? 1;
      return `Buyer #${4800 + seed * 17 % 3200}`;
    }
    const seed = selectedItem?.id ?? selectedRequest?.id ?? 1;
    return `Seller #${2030 + seed}`;
  })();
  const counterpartyLabel = role === 'seller' ? 'Verified Buyer' : 'Verified Seller';
  const itemTitle = selectedItem ? `${selectedItem.name} · ${selectedItem.qty}` : selectedRequest ? `${selectedRequest.product} · ${selectedRequest.qty}` : 'Fresh Rohu · 200 kg';
  const itemEmoji = selectedItem?.img || '🐟';

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title={counterparty} onBack={() => nav.goBack()} right={<StatusPill status="negotiating" />} />

      {/* Pinned deal summary */}
      <View style={styles.pinnedCard}>
        <Text style={styles.pinnedEmoji}>{itemEmoji}</Text>
        <View style={styles.pinnedInfo}>
          <Text style={styles.pinnedTitle}>{itemTitle}</Text>
          <Text style={styles.pinnedAmount}>₹49,000</Text>
          <Text style={styles.pinnedSub}>₹245/kg · 200 kg</Text>
        </View>
        <View style={styles.pinnedBuyer}>
          <Text style={styles.pinnedBuyerLabel}>{counterpartyLabel}</Text>
          <Text style={styles.pinnedRating}>★ 4.8 · 43 deals</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={styles.threadContent}>
          {messages.map((m: any, i: number) => {
            if (m.type === 'system') return (
              <View key={i} style={styles.systemWrap}>
                <Text style={styles.systemText}>{m.text}</Text>
              </View>
            );
            const isMine = m.from === 'seller';
            if (m.type === 'bubble') return (
              <View key={i} style={[styles.bubbleWrap, isMine && styles.bubbleWrapRight]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{m.text}</Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{m.time}</Text>
                </View>
              </View>
            );
            if (m.type === 'offer') return (
              <View key={i} style={[styles.offerWrap, isMine && styles.offerWrapRight]}>
                <View style={[styles.offerCard, { borderColor: isMine ? T.navy : T.amber }]}>
                  <View style={[styles.offerHeader, { backgroundColor: isMine ? T.navy : `${T.amber}15` }]}>
                    <Text style={[styles.offerLabel, { color: isMine ? 'rgba(255,255,255,0.7)' : T.amber }]}>
                      {isMine ? 'YOUR COUNTER OFFER' : 'BUYER OFFER'}
                    </Text>
                  </View>
                  <View style={styles.offerBody}>
                    <Text style={styles.offerPrice}>{m.price}</Text>
                    <Text style={styles.offerDetail}>{m.qty} · Total: <Text style={styles.offerTotal}>{m.total}</Text></Text>
                    <Text style={styles.offerTime}>{m.time}</Text>
                    {m.actions && (
                      <View style={styles.offerActions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => setShowConfirm(true)}>
                          <Text style={styles.acceptText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.counterBtn}>
                          <Text style={styles.counterText}>Counter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn}>
                          <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
            return null;
          })}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputBox}>
            <TextInput
              value={msg}
              onChangeText={setMsg}
              placeholder="Type a message…"
              placeholderTextColor={T.text3}
              style={styles.input}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={sendMsg}>
            <Icon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirm deal modal */}
      <Modal visible={showConfirm} transparent animationType="slide" onRequestClose={() => setShowConfirm(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConfirm(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Ready to finalize?</Text>
          <Text style={styles.modalSub}>Review your deal before confirming</Text>
          {[
            ['Quantity', '200 kg'],
            ['Price', '₹245/kg'],
            ['Subtotal', '₹49,000'],
            ['Platform fee (2%)', '₹980'],
            ['You receive', '₹48,020'],
          ].map(([k, v], i) => (
            <View key={k} style={[styles.dealRow, i < 4 && styles.dealRowBorder]}>
              <Text style={[styles.dealKey, i === 4 && styles.dealKeyBold]}>{k}</Text>
              <Text style={[styles.dealVal, i === 4 && styles.dealValGreen]}>{v}</Text>
            </View>
          ))}
          <View style={styles.modalActions}>
            <Button label="Back" variant="secondary" style={styles.modalBackBtn} onPress={() => setShowConfirm(false)} />
            <Button label="Confirm Deal 🎉" style={styles.modalConfirmBtn} onPress={() => { setShowConfirm(false); nav.goBack(); }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  pinnedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 8, marginHorizontal: 16, padding: 12, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.cardBorder },
  pinnedEmoji: { fontSize: 32, width: 40, textAlign: 'center' },
  pinnedInfo: { flex: 1 },
  pinnedTitle: { fontSize: 13, fontWeight: '700', color: T.text1 },
  pinnedAmount: { fontSize: 18, fontWeight: '900', color: T.navy },
  pinnedSub: { fontSize: 12, color: T.text2 },
  pinnedBuyer: { alignItems: 'center' },
  pinnedBuyerLabel: { fontSize: 11, color: T.text3 },
  pinnedRating: { fontSize: 12, fontWeight: '700', color: T.amber },
  thread: { flex: 1 },
  threadContent: { padding: 16, gap: 10, paddingBottom: 8 },
  systemWrap: { alignSelf: 'center', backgroundColor: `${T.navy}08`, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 },
  systemText: { fontSize: 11, color: T.text3, textAlign: 'center' },
  bubbleWrap: { alignItems: 'flex-start' },
  bubbleWrapRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 14 },
  bubbleMine: { backgroundColor: T.navy, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: T.text1 },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: T.text3, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)' },
  offerWrap: { alignItems: 'flex-start' },
  offerWrapRight: { alignItems: 'flex-end' },
  offerCard: { width: 240, borderRadius: 14, overflow: 'hidden', borderWidth: 2, backgroundColor: T.card },
  offerHeader: { paddingHorizontal: 12, paddingVertical: 8 },
  offerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  offerBody: { padding: 12 },
  offerPrice: { fontSize: 22, fontWeight: '900', color: T.navy },
  offerDetail: { fontSize: 13, color: T.text2, marginTop: 2 },
  offerTotal: { fontWeight: '700', color: T.green },
  offerTime: { fontSize: 10, color: T.text3, marginTop: 4 },
  offerActions: { flexDirection: 'row', gap: 6, marginTop: 10 },
  acceptBtn: { flex: 1, height: 34, borderRadius: 8, backgroundColor: T.green, alignItems: 'center', justifyContent: 'center' },
  acceptText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  counterBtn: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontSize: 12, fontWeight: '700', color: T.navy },
  rejectBtn: { height: 34, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rejectText: { fontSize: 12, fontWeight: '700', color: T.danger },
  inputBar: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline, alignItems: 'center' },
  inputBox: { flex: 1, backgroundColor: T.bg, borderRadius: 22, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hairline, minHeight: 44, justifyContent: 'center' },
  input: { fontSize: 14, color: T.text1, maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.overlay },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: T.text1, marginBottom: 4 },
  modalSub: { fontSize: 13, color: T.text2, marginBottom: 20 },
  dealRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  dealRowBorder: { borderBottomWidth: 1, borderBottomColor: T.hairline },
  dealKey: { fontSize: 14, color: T.text2 },
  dealKeyBold: { fontWeight: '700', color: T.text1 },
  dealVal: { fontSize: 14, fontWeight: '700', color: T.text1 },
  dealValGreen: { color: T.green },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBackBtn: { flex: 1, borderRadius: 12 },
  modalConfirmBtn: { flex: 2, borderRadius: 12 },
});

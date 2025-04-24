import React from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function TestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.menu}>☰</Text>
        <Text style={styles.title}>App name</Text>
        <View style={styles.avatar} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* タブ風ボタン */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Tab</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Tab</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Tab</Text></TouchableOpacity>
        </View>

        {/* カード1 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Title</Text>
          <Text style={styles.cardValue}>$45,678.90</Text>
          <Text style={styles.cardNote}>+20% month over month</Text>
        </View>

        {/* カード2 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Title</Text>
          <Text style={styles.cardValue}>2,405</Text>
          <Text style={styles.cardNote}>+33% month over month</Text>
        </View>

        {/* 下のリスト */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Title</Text>
          <Text style={styles.cardNote}>Elynn Lee - email@fakedomain.net</Text>
          <Text style={styles.cardNote}>Oscar Dum - oscar@fakedomain.net</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  menu: { fontSize: 24 },
  title: { fontSize: 18, fontWeight: 'bold' },
  avatar: { width: 32, height: 32, backgroundColor: '#ccc', borderRadius: 16 },

  tabs: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  tab: {
    backgroundColor: '#eee', paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabText: { fontWeight: 'bold' },

  card: {
    backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  cardNote: { fontSize: 12, color: '#555' },
});

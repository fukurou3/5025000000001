// app/(tabs)/settings.tsx
import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppTheme, ThemeChoice } from '@/hooks/ThemeContext'

// テーマ選択肢
const THEME_OPTIONS: { label: string; value: ThemeChoice }[] = [
  { label: 'システムに合わせる', value: 'system' },
  { label: 'ライトモード', value: 'light' },
  { label: 'ダークモード', value: 'dark' },
]

// カラー選択肢
const COLOR_OPTIONS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63']

export default function SettingsScreen() {
  const {
    themeChoice,
    setThemeChoice,
    colorScheme,
    subColor,
    setSubColor,
  } = useAppTheme()

  const isDark = colorScheme === 'dark'
  const styles = createStyles(isDark, subColor)

  return (
    <SafeAreaView style={styles.container}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>設定</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 表示モード選択 */}
        <View style={styles.card}>
          <Text style={styles.label}>表示モード</Text>
          {THEME_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={styles.optionRow}
              onPress={() => setThemeChoice(opt.value)}
            >
              <View
                style={[
                  styles.radio,
                  themeChoice === opt.value && styles.radioSelected,
                ]}
              />
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* サブカラー選択 */}
        <View style={styles.card}>
          <Text style={styles.label}>サブカラーを選択</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setSubColor(color)}
                style={[
                  styles.colorCircle,
                  {
                    backgroundColor: color,
                    borderWidth: subColor === color ? 3 : 1,
                    borderColor: subColor === color ? '#007aff' : '#ccc',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// スタイルの定義
const createStyles = (isDark: boolean, subColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#ffffff',
    },
    scroll: {
      padding: 20,
    },
    appBar: {
      height: 56,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#121212' : '#ffffff',
    },
    appBarTitle: {
      fontSize: 25,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    card: {
      backgroundColor: isDark ? '#1e1e1e' : '#f4f4f4',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    label: {
      fontSize: 18,
      fontWeight: '600',
      color: subColor,
      marginBottom: 12,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    radio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: '#888',
      marginRight: 12,
    },
    radioSelected: {
      backgroundColor: subColor,
      borderColor: subColor,
    },
    optionLabel: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    colorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    colorCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
  })

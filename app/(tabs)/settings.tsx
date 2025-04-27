// app/(tabs)/settings.tsx

import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, ThemeChoice } from '@/hooks/ThemeContext';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import Slider from '@react-native-community/slider';
import { FontSizeContext, FontSizeKey } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';

export default function SettingsScreen() {
  const {
    themeChoice,
    setThemeChoice,
    colorScheme,
    subColor,
    setSubColor,
  } = useAppTheme();
  const { fontSizeKey, setFontSizeKey } = useContext(FontSizeContext);
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark, subColor, fontSizeKey);

  const THEME_OPTIONS: { label: string; value: ThemeChoice }[] = [
    { label: t('settings.theme_system'), value: 'system' },
    { label: t('settings.theme_light'), value: 'light' },
    { label: t('settings.theme_dark'), value: 'dark' },
  ];

  const COLOR_OPTIONS = [
    '#2196F3',
    '#4CAF50',
    '#FF9800',
    '#9C27B0',
    '#E91E63',
  ];

  const FONT_KEYS: FontSizeKey[] = ['small', 'normal', 'medium', 'large'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 言語設定 */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => router.push('/language')}
          >
            <Text style={styles.optionLabel}>
              {i18n.language.startsWith('ja')
                ? `${t('settings.language_ja')} (${t('settings.current')})`
                : `${t('settings.language_en')} (${t('settings.current')})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 表示モード */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.display_mode')}</Text>
          {THEME_OPTIONS.map((opt) => (
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

        {/* サブカラー */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.sub_color')}</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((color) => (
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

        {/* 文字サイズ */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.font_size')}</Text>
          <Slider
            minimumValue={0}
            maximumValue={3}
            step={1}
            value={FONT_KEYS.indexOf(fontSizeKey)}
            onSlidingComplete={(v: number) =>
              setFontSizeKey(FONT_KEYS[Math.round(v)])
            }
            minimumTrackTintColor={subColor}
            maximumTrackTintColor="#ccc"
          />
          <View style={styles.fontLabelRow}>
            {FONT_KEYS.map((key) => (
              <Text
                key={key}
                style={[
                  styles.fontLabel,
                  fontSizeKey === key && { color: subColor },
                ]}
              >
                {t(`settings.font_size_${key}`)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: keyof typeof fontSizes
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#ffffff' },
    scroll: { padding: 20 },
    appBar: {
      height: 56,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#121212' : '#ffffff',
    },
    appBarTitle: {
      fontSize: fontSizes[fsKey] + 4,
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
      fontSize: fontSizes[fsKey],
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
      fontSize: fontSizes[fsKey],
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
    fontLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    fontLabel: {
      fontSize: fontSizes[fsKey],
      color: isDark ? '#fff' : '#000',
    },
  });

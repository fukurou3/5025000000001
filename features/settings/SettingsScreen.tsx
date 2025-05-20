// SettingsScreen.tsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform, // Platform をインポート
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, ThemeChoice } from '@/hooks/ThemeContext';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n'; // i18n インスタンスを直接インポート
import Slider from '@react-native-community/slider';
import { FontSizeContext, FontSizeKey } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';
import { Ionicons } from '@expo/vector-icons'; // Ionicons をインポート

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768; // isTablet の定義が styles の外にも必要ならここで定義
  const styles = createStyles(isDark, subColor, fontSizeKey, isTablet);

  const THEME_OPTIONS: { label: string; value: ThemeChoice }[] = [
    { label: t('settings.theme_system'), value: 'system' },
    { label: t('settings.theme_light'), value: 'light' },
    { label: t('settings.theme_dark'), value: 'dark' },
  ];

  const COLOR_OPTIONS = [
    '#2196F3', // Blue
    '#0b9c2f', // Dark Green (オリジナルに近い緑)
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#E91E63', // Pink
    // '#121212', // Black - 背景色と被る可能性があるので一旦コメントアウト (または明るいテーマでのみ表示)
    isDark ? '#A0A0A0' : '#757575', // Grey (テーマによって調整)
  ];
  // 黒色のオプションはダークモードでは見えにくいため、代わりにグレーなどを追加

  const FONT_KEYS: FontSizeKey[] = ['small', 'normal', 'medium', 'large'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 言語設定 */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <TouchableOpacity
            style={styles.optionRowButton} // スタイル名を変更して汎用的に
            onPress={() => router.push('/settings/language')} // 実際の言語設定画面パスに置き換え
          >
            <Text style={styles.optionLabel}>
              {i18n.language.startsWith('ja')
                ? `${t('settings.language_ja')}`
                : i18n.language.startsWith('en')
                ? `${t('settings.language_en')}`
                : `${t('settings.language_ko')}` // 仮に韓国語も追加
              }
              <Text style={styles.currentLanguageHint}> ({t('settings.current')})</Text>
            </Text>
            <Ionicons name="chevron-forward" size={fontSizes[fontSizeKey] + 2} color={isDark ? '#A0A0A0' : '#888'} />
          </TouchableOpacity>
        </View>

        {/* 表示モード */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.display_mode')}</Text>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.optionRowButton} // radioの行全体をボタンに
              onPress={() => setThemeChoice(opt.value)}
            >
              <View style={{flexDirection: 'row', alignItems: 'center', flex:1}}>
                <View
                  style={[
                    styles.radio,
                    themeChoice === opt.value && styles.radioSelected,
                  ]}
                />
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </View>
              {themeChoice === opt.value && (
                 <Ionicons name="checkmark-outline" size={fontSizes[fontSizeKey] + 4} color={subColor} />
              )}
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
                  styles.colorCircleBase, // ベーススタイル
                  { backgroundColor: color },
                  subColor === color && styles.colorCircleSelected, // 選択時のスタイル
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
            maximumValue={FONT_KEYS.length - 1} // FONT_KEYSの長さに合わせる
            step={1}
            value={FONT_KEYS.indexOf(fontSizeKey)}
            onSlidingComplete={(v: number) =>
              setFontSizeKey(FONT_KEYS[Math.round(v)])
            }
            minimumTrackTintColor={subColor}
            maximumTrackTintColor={isDark ? "#555" : "#ccc"} // ダークモード時のトラック色調整
            thumbTintColor={Platform.OS === 'android' ? subColor : undefined} // Androidでのみthumbの色を指定
            style={styles.slider}
          />
          <View style={styles.fontLabelRow}>
            {FONT_KEYS.map((key) => (
              <Text
                key={key}
                style={[
                  styles.fontLabel,
                  fontSizeKey === key && { color: subColor, fontWeight: 'bold' },
                ]}
              >
                {t(`settings.font_size_${key}` as any)} {/* tの型エラーを回避するため any を使用 */}
              </Text>
            ))}
          </View>
        </View>

        {/* --- ここから繰り返しタスクの設定項目を追加 --- */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.repeating_tasks_title')}</Text>
          <TouchableOpacity
            style={styles.optionRowButton}
            onPress={() => router.push('/settings/repeating-tasks')}
          >
            <Text style={styles.optionLabel}>
              {t('settings.manage_repeating_tasks')}
            </Text>
            <Ionicons name="chevron-forward" size={fontSizes[fontSizeKey] + 2} color={isDark ? '#A0A0A0' : '#888'} />
          </TouchableOpacity>
        </View>
        {/* --- 繰り返しタスクの設定項目ここまで --- */}

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: keyof typeof fontSizes,
  isTablet: boolean
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#0C0C0C' : '#F2F2F7' }, // 背景色を微調整
    scrollContent: { // ScrollViewのcontentContainerStyle用
      paddingTop: 16,
      paddingBottom: 32, // 下部にも十分なパディング
      paddingHorizontal: isTablet ? 32 : 16, // タブレットと電話でパディングを調整
    },
    appBar: {
      height: 56,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // タイトルを中央に
      // backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', // AppBarの背景
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#3A3A3C' : '#C6C6C8',
    },
    appBarTitle: {
      fontSize: fontSizes[fsKey] + (Platform.OS === 'ios' ? 2 : 1), // OS毎に微調整
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      color: isDark ? '#EFEFF0' : '#1C1C1E',
    },
    card: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', // カード背景
      borderRadius: Platform.OS === 'ios' ? 10 : 8,
      paddingHorizontal: 16, // カード内の左右パディング
      // paddingVertical は各行で調整するため、ここでは設定しない
      marginBottom: 20,
      // iOS風の影（オプション）
      // shadowColor: '#000',
      // shadowOffset: { width: 0, height: 1 },
      // shadowOpacity: isDark ? 0.3 : 0.1,
      // shadowRadius: 2,
      // elevation: 2, // Androidの影
    },
    label: {
      fontSize: fontSizes[fsKey] + (Platform.OS === 'ios' ? 1 : 0),
      fontWeight: Platform.OS === 'ios' ? '500' : '600',
      color: subColor,
      paddingTop: 16, // ラベルの上のパディング
      paddingBottom: 8, // ラベルの下のパディング
    },
    optionRowButton: { // ラジオボタンや言語設定行などのスタイル
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between', // ラベルとシェブロン/チェックマークを両端に
      paddingVertical: 12, // 行の上下パディング
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? '#3A3A3C' : '#E0E0E0', // 区切り線の色を微調整
    },
    radio: {
      width: 22, // サイズを少し大きく
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: isDark ? '#5A5A5E' : '#AEAEB2', // ラジオボタンの枠線
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioSelected: {
      borderColor: subColor,
      // 内側の円は疑似要素やIconで表現した方が綺麗だが、簡易的にbackgroundColorで対応
      // もし内側の円が必要なら、<View style={styles.radioInnerCircle} /> を中に入れる
      // backgroundColor: subColor, // これだと全体が塗りつぶされる
    },
    // radioInnerCircle: { // 選択時の中の円（オプション）
    //   width: 12,
    //   height: 12,
    //   borderRadius: 6,
    //   backgroundColor: subColor,
    // },
    optionLabel: {
      fontSize: fontSizes[fsKey] + (Platform.OS === 'ios' ? 2 : 1),
      color: isDark ? '#EFEFF0' : '#1C1C1E',
      flexShrink: 1, // ラベルが長い場合に縮小するように
    },
    currentLanguageHint: { // "(現在)" の部分のスタイル
      fontSize: fontSizes[fsKey] -1,
      color: isDark ? '#8E8E93' : '#6D6D72',
    },
    colorRow: {
      flexDirection: 'row',
      justifyContent: 'space-around', // space-between から space-around へ変更して均等配置
      alignItems: 'center',
      paddingVertical: 12, // 上下パディング
    },
    colorCircleBase: { // カラー選択の円の基本スタイル
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent', // 通常時は枠線なし
    },
    colorCircleSelected: { // 選択されているカラーの円のスタイル
      borderColor: subColor, // 選択されている色で枠線
      transform: [{ scale: 1.1 }], // 少し大きくして選択を強調
    },
    slider: {
        marginVertical: Platform.OS === 'ios' ? 10 : 0, // スライダーの上下マージン
    },
    fontLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8, // スライダーとの間隔
      paddingBottom: 12, // カード下部との間隔
    },
    fontLabel: {
      fontSize: fontSizes[fsKey] - (Platform.OS === 'ios' ? 0 : 1),
      color: isDark ? '#8E8E93' : '#6D6D72', // 通常時のフォントラベル色
    },
  });
// app/features/add/components/DeadlineSettingModal/styles.ts
import { StyleSheet, Platform } from 'react-native';
import type { DeadlineModalStyles } from './types';
import { fontSizes as appFontSizes } from '@/constants/fontSizes'; // アプリ全体のフォントサイズ定義
import type { FontSizeKey } from '@/context/FontSizeContext';

export const createDeadlineModalStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: FontSizeKey,
): DeadlineModalStyles => {
  const fontSizes = appFontSizes; // Alias for clarity
  const baseTextColor = isDark ? '#FFFFFF' : '#000000';
  const faintTextColor = isDark ? '#A0A0A0' : '#555555';
  const backgroundColor = isDark ? '#1C1C1E' : '#F2F2F7';
  const contentBackgroundColor = isDark ? '#000000' : '#FFFFFF';
  const borderColor = isDark ? '#3A3A3C' : '#D1D1D6';

  return StyleSheet.create<DeadlineModalStyles>({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
      height: '90%', // 画面占有率を調整
      backgroundColor: backgroundColor,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden', // borderRadiusを子要素にも適用
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: borderColor,
      alignItems: 'center',
    },
    headerText: {
      fontSize: fontSizes[fsKey] - 1,
      fontWeight: '500',
      color: baseTextColor,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between', // "キャンセル" と "保存" を両端に
      paddingVertical: Platform.OS === 'ios' ? 12 : 16,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16, // SafeAreaを考慮
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: '45%', // ボタン幅を調整
      alignItems: 'center',
      borderWidth: 1,
      borderColor: subColor,
    },
    buttonText: {
      fontSize: fontSizes[fsKey],
      fontWeight: '600',
      color: subColor,
    },
    saveButton: {
      backgroundColor: subColor,
      borderColor: subColor, // 保存ボタンは枠線なしにもできる
    },
    saveButtonText: {
      color: isDark ? '#000000' : '#FFFFFF', // subColorとのコントラスト考慮
    },
    tabBar: {
      backgroundColor: backgroundColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: borderColor,
      elevation: 0, // Androidの影を消す
      shadowOpacity: 0, // iOSの影を消す
    },
    tabLabel: {
      fontSize: fontSizes[fsKey] - 1,
      fontWeight: '600',
      textTransform: 'none',
      paddingHorizontal: 0, // ラベルの余白調整
    },
    tabIndicator: {
      backgroundColor: subColor,
      height: 2,
    },
    tabContentContainer: {
      flex: 1,
      backgroundColor: contentBackgroundColor,
    },
    label: {
      fontSize: fontSizes[fsKey],
      color: baseTextColor,
      marginBottom: 2,
      fontWeight: '500',
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14, // 少し広めに
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: borderColor,
    },
    timePickerToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: borderColor,
      marginTop: 8,
    },
    timePickerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8', // Picker背景
    },
    wheelPickerWrapper: {
      marginHorizontal: Platform.OS === 'ios' ? 0 : 5, // iOSとAndroidで調整
    },
    timeSeparator: {
      color: baseTextColor,
      fontSize: fontSizes[fsKey] + 2,
      marginHorizontal: 0,
      fontWeight: 'bold',
    },
    frequencyPickerContainer: {
        // Pickerコンポーネントに合わせたスタイル
    },
    intervalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    intervalInput: {
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      width: 60,
      textAlign: 'center',
      fontSize: fontSizes[fsKey],
      color: baseTextColor,
      marginRight: 8,
    },
    intervalText: {
        fontSize: fontSizes[fsKey],
        color: baseTextColor,
    },
    weekDaysContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    daySelector: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1.5,
      borderColor: subColor,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    daySelectorSelected: {
      backgroundColor: subColor,
    },
    daySelectorText: {
      color: subColor,
      fontSize: fontSizes[fsKey] - 2,
      fontWeight: '600',
    },
    daySelectorTextSelected: {
      color: isDark ? '#000' : '#FFF',
    },
    repeatEndOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'transparent', //非選択時は枠なし
        borderRadius: 8,
        marginBottom: 8,
    },
    repeatEndOptionSelected: {
        borderColor: subColor, //選択時に枠表示
        backgroundColor: isDark ? subColor + '30' : subColor + '20' //subColorの薄い色
    },
    repeatEndText: {
        fontSize: fontSizes[fsKey],
        color: baseTextColor,
    },
    calendarOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    calendarInModalContainer: {
      width: '90%',
      maxWidth: 400,
      borderRadius: 12,
      paddingVertical: 10,
      backgroundColor: contentBackgroundColor,
      alignItems: 'stretch', // カレンダーが幅いっぱいに広がるように
    },
    clearRepeatEndDateButton: {
      alignSelf: 'center',
      paddingVertical: 12,
    },
    periodButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly', // 等間隔に配置
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: borderColor,
    },
    periodButton: {
      paddingVertical: 10,
      paddingHorizontal: 12, // 少し広めに
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: subColor,
      minWidth: '45%',
      alignItems: 'center',
    },
    periodButtonSelected: {
      backgroundColor: subColor,
    },
    periodButtonText: {
      color: subColor,
      fontSize: fontSizes[fsKey] - 1,
      fontWeight: '500',
    },
    periodButtonTextSelected: {
      color: isDark ? '#000' : '#FFF',
    },
    pickerText: {
        fontSize: fontSizes[fsKey],
        color: baseTextColor,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    textInput: {
        fontSize: fontSizes[fsKey],
        color: baseTextColor,
        padding: 10,
        borderWidth: 1,
        borderColor: borderColor,
        borderRadius: 6,
    },
       modal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
  });
};
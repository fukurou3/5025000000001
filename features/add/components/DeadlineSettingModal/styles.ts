// app/features/add/components/DeadlineSettingModal/styles.ts
import { StyleSheet, Platform, TextStyle } from 'react-native';
import type { DeadlineModalStyles } from './types';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import type { FontSizeKey } from '@/context/FontSizeContext';

export const createDeadlineModalStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: FontSizeKey,
): DeadlineModalStyles => {
  const fontSizes = appFontSizes;
  const baseTextColor = isDark ? '#FFFFFF' : '#000000';
  const backgroundColor = isDark ? '#1C1C1E' : '#F2F2F7';
  const contentBackgroundColor = isDark ? '#000000' : '#FFFFFF';
  const iosModalContentBackgroundColor = isDark ? '#1A1A1A' : '#F0F0F0'; // (前回と同様)
  const iosSeparatorColor = isDark ? '#38383A' : '#C7C7CC'; // (前回と同様)

  const baseButtonFontSize = fontSizes[fsKey];

  return StyleSheet.create<DeadlineModalStyles>({
    // ... (overlay, container, headerContainer, headerText, footer, button, buttonText, saveButton, saveButtonText, tabBar, tabLabel, tabIndicator, tabContentContainer は前回と同様) ...
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
      height: '90%',
      backgroundColor: backgroundColor,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
      alignItems: 'center',
      backgroundColor: iosModalContentBackgroundColor,
    },
    headerText: {
      fontSize: fontSizes[fsKey] - 1,
      fontWeight: '600',
      color: baseTextColor,
    },
    footer: {
      flexDirection: 'row',
      paddingVertical: Platform.OS === 'ios' ? 12 : 16,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
      backgroundColor: iosModalContentBackgroundColor,
      gap: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 5,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: subColor,
      minHeight: 40,
    },
    buttonText: {
      fontSize: baseButtonFontSize,
      fontWeight: '600',
      color: subColor,
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: subColor,
      borderColor: subColor,
    },
    saveButtonText: {
      color: isDark ? '#000000' : '#FFFFFF',
      fontSize: baseButtonFontSize,
      fontWeight: '600',
      textAlign: 'center',
    },
    tabBar: {
      backgroundColor: backgroundColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabLabel: {
      fontSize: fontSizes[fsKey] - 1,
      fontWeight: '600',
      textTransform: 'none',
      paddingHorizontal: 0,
    } as TextStyle,
    tabIndicator: {
      backgroundColor: subColor,
      height: 2,
    },
    tabContentContainer: {
      flex: 1,
      backgroundColor: contentBackgroundColor,
    },


    label: { // ピッカー内のラベルなど
      fontSize: fontSizes[fsKey], // このlabelは汎用的なので、ピッカー専用の文字サイズは TimePickerModal で調整
      color: baseTextColor,
      marginBottom: 2,
      fontWeight: '500',
    },
    // ... (settingRow, timePickerToggleContainer, pickerText は前回と同様) ...
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
    },
    timePickerToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
      marginTop: 8,
    },
    pickerText: {
        fontSize: fontSizes[fsKey],
        color: baseTextColor,
        paddingVertical: Platform.OS === 'ios' ? 2 : 0,
    },

    modal: { // react-native-modal の style prop 用
      justifyContent: 'flex-end',
      margin: 0,
    },
    timePickerModalContainer: { // TimePickerModal のコンテナ (SafeAreaViewに適用)
        width: '100%', 
        alignSelf: 'stretch',
        backgroundColor: iosModalContentBackgroundColor,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        paddingBottom: Platform.OS === 'ios' ? 0 : 10, // Android向けSafeArea代替
    },
    timePickerContentContainer: { // ヘッダー、ピッカー、フッターを実際に含むコンテナ
      // paddingHorizontal は TimePickerModal.tsx で動的に設定して線を端まで引けるようにする
    },
    pickerRowSeparator: { // ピッカーの選択行の上下に引く線
        height: StyleSheet.hairlineWidth,
        backgroundColor: iosSeparatorColor,
        // width は TimePickerModal.tsx で画面幅 - padding で計算
        // marginHorizontal は TimePickerModal.tsx で適用
    },
    timePickerContainer: { // ホイールピッカー全体を囲むView
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Platform.OS === 'ios' ? 10 : 8, // 上下の余白を少し詰める
      // paddingHorizontal は pickerRowSeparator との兼ね合いで調整
    },
    wheelPickerWrapper: {
      marginHorizontal: Platform.OS === 'ios' ? 0 : 1,
    },
    timeSeparator: {
      color: baseTextColor,
      fontWeight: (Platform.OS === 'ios' ? '300' : 'normal') as TextStyle['fontWeight'],
      marginHorizontal: Platform.OS === 'ios' ? -3 : -1, // iOSではコロンをさらにホイールに近づける
      textAlignVertical: 'center',
    },
    timePickerModalFooter: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 10 : 16,
        paddingHorizontal: 16, // フッター内の左右パディングは維持
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: iosSeparatorColor,
        flexDirection: 'row',
        gap: 8,
    },
    timePickerModalButton: {
        // 'button' スタイルを継承
    },
    // ... (残りのスタイルは前回と同様) ...
    frequencyPickerContainer: {
    },
    intervalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    intervalInput: {
      borderWidth: 1,
      borderColor: iosSeparatorColor,
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
        borderColor: 'transparent',
        borderRadius: 8,
        marginBottom: 8,
    },
    repeatEndOptionSelected: {
        borderColor: subColor,
        backgroundColor: isDark ? subColor + '30' : subColor + '20'
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
      alignItems: 'stretch',
    },
    clearRepeatEndDateButton: {
      alignSelf: 'center',
      paddingVertical: 12,
    },
    periodButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
    },
    periodButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
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
    textInput: {
        fontSize: fontSizes[fsKey],
        color: baseTextColor,
        padding: 10,
        borderWidth: 1,
        borderColor: iosSeparatorColor,
        borderRadius: 6,
    },
  });
};
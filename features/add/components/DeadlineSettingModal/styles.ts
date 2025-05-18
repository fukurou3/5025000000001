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
  const backgroundColor = isDark ? '#1C1C1E' : '#ededed'; // タブバーの背景色として使用
  const contentBackgroundColor = isDark ? '#000000' : '#FFFFFF'; // アクティブタブの背景色やモーダル全体の背景
  const iosModalContentBackgroundColor = isDark ? '#000000' : '#FFFFFF';
  const iosSeparatorColor = isDark ? '#000000' : '#FFFFFF';

  const baseButtonFontSize = fontSizes[fsKey];
  const headerBaseFontSize = fontSizes[fsKey];

  return StyleSheet.create<DeadlineModalStyles>({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
      height: '65%',
      backgroundColor: iosModalContentBackgroundColor,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: iosSeparatorColor,
      alignItems: 'center',
      backgroundColor: iosModalContentBackgroundColor,
    },
    headerText: {
      fontSize: headerBaseFontSize + 3,
      fontWeight: '600',
      color: subColor,
      textAlign: 'center',
      lineHeight: headerBaseFontSize + 8,
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
    // --- TabBar Styles Start ---
    tabBarContainer: { // このコンテナは残しつつ、パディングやマージンでタブバーの位置を調整
      paddingHorizontal: 16, // 画面左右の余白
      paddingVertical: 8, // 上下の余白
      backgroundColor: iosModalContentBackgroundColor, // モーダル全体の背景色と同じにする
    },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: backgroundColor, // ユーザー指定のグレー背景
      borderRadius: 20,
      padding: 4,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 18,
      marginHorizontal: 2,
    },
    tabItemActive: {
      backgroundColor: contentBackgroundColor, // アクティブタブは白または黒の背景
    },
    tabItemInactive: {
      backgroundColor: 'transparent',
    },
    tabLabel: {
      fontSize: fontSizes[fsKey] - 1,
      fontWeight: '600',
      textTransform: 'none',
      textAlign: 'center',
    } as TextStyle,
    tabLabelActive: {
        color: subColor,
    },
    tabLabelInactive: {
        color: baseTextColor, // 非アクティブ時のテキスト色はベースのテキスト色
    },
    tabIndicator: {
      height: 0,
      backgroundColor: 'transparent',
    },
    // --- TabBar Styles End ---
    tabContentContainer: {
      flex: 1,
      backgroundColor: contentBackgroundColor,
    },
    label: {
      fontSize: fontSizes[fsKey],
      color: subColor,
      marginBottom: 0,
      fontWeight: '600',
    },
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
    modal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    timePickerModalContainer: {
        width: '100%',
        alignSelf: 'stretch',
        backgroundColor: iosModalContentBackgroundColor,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    },
    timePickerContentContainer: {
    },
    pickerRowSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: iosSeparatorColor,
    },
    timePickerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    },
    wheelPickerWrapper: {
      marginHorizontal: Platform.OS === 'ios' ? 0 : 1,
    },
    timeSeparator: {
      fontWeight: (Platform.OS === 'ios' ? '300' : 'normal') as TextStyle['fontWeight'],
      marginHorizontal: Platform.OS === 'ios' ? -3 : -1,
      textAlignVertical: 'center',
    },
    timePickerModalFooter: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 10 : 16,
        paddingHorizontal: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: iosSeparatorColor,
        flexDirection: 'row',
        gap: 8,
    },
    timePickerModalButton: {
    },
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
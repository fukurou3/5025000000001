// app/features/tasks/styles.ts
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import type { FontSizeKey } from '@/context/FontSizeContext';

export type TaskScreenStyles = {
  taskItemContainer: ViewStyle;
  taskItem: ViewStyle;
  checkboxContainer: ViewStyle;
  taskCenter: ViewStyle;
  taskTitle: TextStyle;
  taskMemo: TextStyle;
  taskTime: TextStyle;
  noDeadlineText: TextStyle;
  selectionIconContainer: ViewStyle;
  container: ViewStyle; // 必須
  appBar: ViewStyle;   // 必須
  title: TextStyle;
  topRow: ViewStyle;
  tabs: ViewStyle;
  tabButton: ViewStyle;
  tabSelected: ViewStyle;
  tabText: TextStyle;
  tabSelectedText: TextStyle;
  sortLabel: TextStyle;
  loader: ViewStyle;
  fab: ViewStyle;
  selectionBar: ViewStyle;
  selectionAction: TextStyle;
  modalBlur: ViewStyle;
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  modalOption: TextStyle;
  folderContainer: ViewStyle;
  folderHeader: ViewStyle;
  folderName: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  reorderButton: ViewStyle;
  folderHeaderSelected: ViewStyle;
  folderIconStyle: ViewStyle;
  folderTaskItemContainer: ViewStyle;
};

export const createStyles = (isDark: boolean, subColor: string, fontSizeKey: FontSizeKey): TaskScreenStyles => {
  const baseFontSize = appFontSizes[fontSizeKey];
  const dynamicSubColor = subColor || (isDark ? '#4875B7' : '#2F5A8F');

  return StyleSheet.create({
    // --- 必須プロパティ ---
    container: { //
        flex: 1, //
        backgroundColor: isDark ? '#000' : '#F2F2F7', //
    },
    appBar: { //
        height: 50, //
        justifyContent: 'center', //
        alignItems: 'center', //
        backgroundColor: isDark ? '#000' : '#F2F2F7', //
        borderBottomWidth: StyleSheet.hairlineWidth, //
        borderBottomColor: isDark ? '#3A3A3C' : '#C6C6C8', //
    },
    title: { //
        fontSize: baseFontSize + 2, //
        fontWeight: 'bold', //
        color: isDark ? '#FFF' : '#000', //
    },
    topRow: { //
        flexDirection: 'row', //
        justifyContent: 'space-between', //
        alignItems: 'center', //
        paddingHorizontal: 16, //
        paddingVertical: 8, //
        backgroundColor: isDark ? '#000' : '#F2F2F7', //
    },
    tabs: { //
        flexDirection: 'row', //
        backgroundColor: isDark ? '#2C2C2E' : '#E9E9ED', //
        borderRadius: 8, //
        padding:2, //
    },
    tabButton: { //
        paddingHorizontal: 12, //
        paddingVertical: 6, //
        borderRadius: 7, //
        minWidth: 80, //
        alignItems: 'center', //
    },
    tabSelected: { //
        backgroundColor: isDark ? dynamicSubColor : '#FFFFFF', //
        shadowColor: '#000', //
        shadowOffset: { width: 0, height: 1 }, //
        shadowOpacity: isDark ? 0.3 : 0.1, //
        shadowRadius: 2, //
        elevation: 2, //
    },
    tabText: { //
        fontSize: baseFontSize -1, //
        fontWeight: '500', //
        color: isDark ? '#FFF' : '#000', //
    },
    tabSelectedText: { //
        color: isDark ? '#FFF' : dynamicSubColor, //
        fontWeight: '600', //
    },
    sortLabel: { //
        fontSize: baseFontSize -1, //
        color: dynamicSubColor, //
        marginRight: 4, //
    },
    loader: { //
        marginTop: 50, //
    },
    fab: { //
        position: 'absolute', //
        margin: 16, //
        right: 10, //
        bottom: 70, //
        backgroundColor: dynamicSubColor, //
        width: 56, //
        height: 56, //
        borderRadius: 28, //
        justifyContent: 'center', //
        alignItems: 'center', //
        elevation: 4, //
        shadowColor: '#000', //
        shadowOffset: { width: 0, height: 2 }, //
        shadowOpacity: 0.2, //
        shadowRadius: 2, //
    },
    selectionBar: { //
        position: 'absolute', //
        left: 0, //
        right: 0, //
        backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8', //
        borderTopWidth: StyleSheet.hairlineWidth, //
        borderColor: isDark ? '#3A3A3C' : '#C6C6C8', //
        flexDirection: 'row', //
        justifyContent: 'space-around', //
        alignItems: 'center', //
        paddingBottom: 4, //
    },
    selectionAction: { //
    },
    modalBlur: { //
        flex: 1, //
        justifyContent: 'center', //
        alignItems: 'center', //
    },
    modalContainer: { //
        justifyContent: 'center', //
        alignItems: 'center', //
        flex: 1, //
    },
    modalContent: { //
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', //
        borderRadius: 14, //
        padding: 20, //
        minWidth: 270, //
        alignItems: 'center', //
        shadowColor: '#000', //
        shadowOffset: { width: 0, height: 2 }, //
        shadowOpacity: 0.25, //
        shadowRadius: 3.84, //
        elevation: 5, //
    },
    modalOption: { //
        fontSize: baseFontSize +1, //
        paddingVertical: 12, //
        textAlign: 'center', //
    },
    emptyContainer: { //
        flex: 1, //
        justifyContent: 'center', //
        alignItems: 'center', //
        marginTop: 50, //
        paddingHorizontal: 20, //
    },
    emptyText: { //
        fontSize: baseFontSize, //
        color: isDark ? '#8E8E93' : '#6D6D72', //
        textAlign: 'center', //
    },
    reorderButton: { //
        paddingHorizontal: 8, //
    },

    // --- タスクアイテム関連 ---
    taskItemContainer: { //
      paddingHorizontal: 16, //
      paddingVertical: 10, //
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', //
      borderBottomWidth: StyleSheet.hairlineWidth, //
      borderBottomColor: isDark ? '#3A3A3C' : '#E0E0E0', //
    },
    taskItem: { //
        flexDirection: 'row', //
        alignItems: 'center', //
        flex: 1, //
    },
    checkboxContainer: { //
        paddingRight: 12, //
        paddingLeft: 4, //
        paddingVertical: 8, //
    },
    taskCenter: { //
        flex: 1, //
        justifyContent: 'center', //
        marginRight: 8, //
    },
    taskTitle: { //
        fontSize: baseFontSize, //
        color: isDark ? '#FFFFFF' : '#000000', //
        fontWeight: '500', //
    },
    taskMemo: { //
        fontSize: baseFontSize - 2, //
        color: isDark ? '#8E8E93' : '#6D6D72', //
        marginTop: 2, //
    },
    taskTime: { //
        fontSize: baseFontSize - 1, //
    },
    noDeadlineText: { //
        fontStyle: 'italic', //
        color: isDark ? '#8E8E93' : '#6D6D72', //
    },
    selectionIconContainer: { //
        marginLeft: 'auto', //
        paddingLeft: 10, //
    },

    // --- 前回変更/追加したフォルダ関連スタイル ---
    folderContainer: {
      marginHorizontal: 16,
      marginVertical: 10,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 10,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.25 : 0.18,
      shadowRadius: 2.84,
    },
    folderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#3A3A3C' : '#DDE1E6',
    },
    folderHeaderSelected: { //
        backgroundColor: isDark ? dynamicSubColor + '40' : dynamicSubColor + '20', //
    },
    folderName: { //
        fontSize: baseFontSize, //
        fontWeight: '600', //
        color: isDark ? '#FFFFFF' : '#000000', //
        flex: 1, //
    },
    folderIconStyle: {
        marginRight: 8,
        marginLeft: 4,
    },
    folderTaskItemContainer: {
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? '#303030' : '#E8E8E8',
        paddingLeft: 36,
    },
  });
};
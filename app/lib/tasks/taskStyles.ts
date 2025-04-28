// lib/tasks/taskStyles.ts

import { StyleSheet } from 'react-native';
import { fontSizes } from '@/constants/fontSizes';

export const createStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: keyof typeof fontSizes
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f2f2f2',
    },
    appBar: {
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: fontSizes[fsKey] + 6,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingHorizontal: 16,
      zIndex: 2,
    },
    tabs: { flexDirection: 'row' },
    tabButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#aaa',
      marginRight: 8,
      backgroundColor: '#eee',
      justifyContent: 'center',
    },
    tabSelected: { backgroundColor: subColor, borderColor: subColor },
    tabText: {
      fontSize: fontSizes[fsKey],
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    tabSelectedText: { color: '#fff' },
    sortIconButton: { padding: 6 },
    sortLabel: {
      fontSize: fontSizes[fsKey] + 2,
      color: isDark ? '#fff' : '#000',
      marginRight: 4,
    },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: fontSizes[fsKey],
      color: '#aaa',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    sectionHeader: {
      fontSize: fontSizes[fsKey],
      fontWeight: 'bold',
      color: subColor,
      backgroundColor: isDark ? '#333' : '#eee',
      paddingVertical: 4,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 8,
      marginBottom: 4,
      alignSelf: 'flex-start',
    },

    // ↓ タスク行（TaskItem）レイアウト ↓
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      marginHorizontal: 8,    // 横余白を狭めて横幅を確保
      marginVertical: 4,
      paddingVertical: 8,
      paddingHorizontal: 0,
    },
    checkboxContainer: {
      marginLeft: 4,          // チェックボックス左余白を縮小
      marginRight: 8,         // チェックボックス右余白を縮小
    },
    taskCenter: { flex: 1 },
    taskTitle: {
      fontSize: fontSizes[fsKey] + 2,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    taskMemo: {
      fontSize: fontSizes[fsKey],
      color: isDark ? '#ccc' : '#555',
      marginTop: 2,
    },
    taskRight: {
      alignItems: 'flex-end',
      marginLeft: 4,          // 時間表示の左余白を縮小
    },
    taskTime: {
      fontSize: fontSizes[fsKey],
      fontWeight: 'bold',
    },

    fab: {
      position: 'absolute',
      bottom: 32,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: subColor,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    modalBlur: { flex: 1 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalContent: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      width: '80%',
      borderRadius: 12,
      padding: 16,
    },
    modalOption: {
      fontSize: fontSizes[fsKey] + 2,
      paddingVertical: 8,
    },
    folderContainer: {
      backgroundColor: isDark ? '#2e2e2e' : '#ffffff',
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 12,
      elevation: 2,
    },
    folderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    folderTitleRow: { flexDirection: 'row', alignItems: 'center' },
    folderTitleText: {
      fontSize: fontSizes[fsKey] + 2,
      fontWeight: 'bold',
      marginLeft: 8,
      color: subColor,
    },

    // ↓ 選択モード用タブバー（BottomTabと同じデザイン） ↓
    selectionBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: isDark ? '#121212' : '#fff',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? '#333' : '#ccc',
      paddingTop: 6,
      zIndex: 10,
    },
    selectionAction: {
      fontSize: fontSizes[fsKey],
      color: isDark ? '#888' : '#888',
      textAlign: 'center',
    },
  });

// app/features/tasks/styles.ts
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import type { FontSizeKey } from '@/context/FontSizeContext';

export type TaskScreenStyles = {
  // --- タスクアイテム関連 ---
  taskItemContainer: ViewStyle; // 個々のタスクアイテム全体（背景、余白など）
  taskItem: ViewStyle;          // タスクアイテム内の要素の配置（横並びなど）
  checkboxContainer: ViewStyle; // タスクのチェックボックス部分
  taskCenter: ViewStyle;        // タスク名とメモを表示する中央エリア
  taskTitle: TextStyle;         // タスクのタイトル文字
  taskMemo: TextStyle;          // タスクのメモ文字
  taskTime: TextStyle;          // (現状のTaskItem.tsxでは直接使用されていないが、時刻表示用として定義)
  noDeadlineText: TextStyle;    // 「期限なし」の文字
  taskDeadlineDisplayTextBase: TextStyle; // 期限表示の基本スタイル
  selectionIconContainer: ViewStyle; // 選択モード時の右端のチェックマークアイコンのコンテナ

  // --- 画面全体・上部 ---
  container: ViewStyle;         // 画面全体のコンテナ
  appBar: ViewStyle;            // 画面上部のヘッダーバー
  title: TextStyle;             // ヘッダーバーのタイトル文字
  topRow: ViewStyle;            // タブとソートボタンが配置される行
  tabs: ViewStyle;              // 「未完了」「完了」タブのコンテナ
  tabButton: ViewStyle;         // 各タブボタン
  tabSelected: ViewStyle;       // 選択中のタブボタン
  tabText: TextStyle;           // タブボタンの文字
  tabSelectedText: TextStyle;   // 選択中のタブボタンの文字
  sortButton: ViewStyle;        // ソートボタンのタッチ領域
  sortLabel: TextStyle;         // ソート条件表示の文字（「日付順」など）

  // --- その他 ---
  loader: ViewStyle;            // ローディング中のインジケーター
  fab: ViewStyle;               // 右下の追加ボタン (Floating Action Button)
  selectionBar: ViewStyle;      // 項目選択モード時に画面下部に表示されるバー
  selectionActionContainer: ViewStyle; // 選択バー内の各操作項目（「すべて選択」など）のコンテナ
  selectionActionText: TextStyle;    // 選択バー内の各操作項目の文字

  // --- モーダル関連 ---
  modalBlur: ViewStyle;         // モーダル表示時の背景ブラー効果
  modalContainer: ViewStyle;    // モーダルウィンドウの配置用コンテナ
  modalContent: ViewStyle;      // モーダルウィンドウ本体のスタイル
  modalOption: TextStyle;       // モーダル内の選択肢の文字（ソートモーダルなど）
  modalTitle: TextStyle;        // モーダルのタイトル文字

  // --- フォルダ関連 ---
  folderContainer: ViewStyle;   // フォルダ全体のコンテナ
  folderHeader: ViewStyle;      // フォルダのヘッダー部分（フォルダ名や開閉アイコンがあるエリア）
  folderName: TextStyle;        // フォルダ名の文字
  emptyContainer: ViewStyle;    // タスクやフォルダがない場合に表示される「空です」などのメッセージエリア
  emptyText: TextStyle;         // 「空です」などのメッセージ文字
  reorderButton: ViewStyle;     // フォルダ並び替え時の上下矢印ボタン
  folderHeaderSelected: ViewStyle; // 選択モードでフォルダが選択された時のヘッダースタイル
  folderIconStyle: ViewStyle;   // フォルダヘッダーのフォルダアイコン
  folderTaskItemContainer: ViewStyle; // フォルダ内のタスクアイテムのコンテナスタイル
};

export const createStyles = (isDark: boolean, subColor: string, fontSizeKey: FontSizeKey): TaskScreenStyles => {
  const baseFontSize = appFontSizes[fontSizeKey];
  const dynamicSubColor = subColor || (isDark ? '#4875B7' : '#2F5A8F');

  const BORDER_RADIUS_SM = 8;
  const BORDER_RADIUS_MD = 12;
  const BORDER_RADIUS_LG = 16;

  const shadowStyle = {
    shadowColor: isDark ? '#000' : '#555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  };

  const cardBackground = isDark ? '#1f1f21' : '#FFFFFF';
  const secondaryTextDark = '#AEAEB2';
  const secondaryTextLight = '#6D6D72';

  return StyleSheet.create({
    // --- 画面全体・上部 ---
    container: { // 画面全体の背景など
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#f2f2f4',
    },
    appBar: { // 画面上部のタイトルバー
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#000000' : '#f2f2f4',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#3A3A3C' : '#D1D1D6',
    },
    title: { // タイトルバーの文字
      fontSize: baseFontSize + 3,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    topRow: { // タブとソートボタンを含む行のスタイル
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: isDark ? '#000000' : '#f2f2f4',
    },
    tabs: { // 「未完了」「完了」タブのコンテナ
      flexDirection: 'row',
      backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0',
      borderRadius: BORDER_RADIUS_MD,
      padding: 3,
    },
    tabButton: { // 各タブボタン
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: BORDER_RADIUS_SM,
      minWidth: 90,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabSelected: { // 選択されているタブボタン
      backgroundColor: dynamicSubColor,
      ...shadowStyle,
      elevation: 4,
    },
    tabText: { // タブボタンの文字
      fontSize: baseFontSize - 0.5,
      fontWeight: '500',
      color: isDark ? '#E0E0E0' : '#333333',
    },
    tabSelectedText: { // 選択されているタブボタンの文字
      color: '#FFFFFF',
      fontWeight: '600',
    },
    sortButton: { // ソートボタンのタッチ領域とアイコンの配置
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: BORDER_RADIUS_SM,
    },
    sortLabel: { // ソート条件表示の文字（「日付順」など）
      fontSize: baseFontSize - 1,
      color: dynamicSubColor,
      marginRight: 6,
      fontWeight: '500',
    },
    // --- ローディング ---
    loader: { // ローディング中のスピナー表示領域
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // --- FAB (Floating Action Button) ---
    fab: { // 右下の「＋」ボタン
      position: 'absolute',
      margin: 16,
      right: 16,
      bottom: 16,
      backgroundColor: dynamicSubColor,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadowStyle,
      elevation: 6,
    },
    // --- 選択モード時の下部バー ---
    selectionBar: { // 項目選択中に表示される下部のアクションバー
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? '#3A3A3C' : '#C6C6C8',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      height: 60,
    },
    selectionActionContainer: { // 選択バー内の各アクションボタン（アイコンとテキスト）のコンテナ
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    selectionActionText: { // 選択バー内のアクションボタンのテキスト
      fontSize: baseFontSize - 2.5,
      color: dynamicSubColor,
      marginTop: 2,
      fontWeight: '500',
    },
    // --- モーダル関連 ---
    modalBlur: { // モーダル表示時の背景のブラー効果
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: { // モーダルウィンドウの位置調整用コンテナ
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      padding: 20,
    },
    modalContent: { // モーダルウィンドウ自体のスタイル（背景色、角丸、パディングなど）
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      borderRadius: BORDER_RADIUS_LG,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      alignItems: 'stretch',
      ...shadowStyle,
      elevation: 10,
    },
    modalTitle: { // モーダルのタイトル文字
        fontSize: baseFontSize + 2,
        fontWeight: '600',
        color: isDark ? '#FFF' : '#000',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalOption: { // モーダル内の選択肢の文字スタイル（ソートモーダルなど）
      fontSize: baseFontSize + 1,
      paddingVertical: 14,
      textAlign: 'center',
      color: isDark ? '#E0E0E0' : '#222222',
    },
    // --- リストが空の場合の表示 ---
    emptyContainer: { // タスクやフォルダが存在しない場合に表示されるメッセージのコンテナ
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginTop: 30,
    },
    emptyText: { // 「タスクがありません」などのメッセージ文字
      fontSize: baseFontSize,
      color: isDark ? secondaryTextDark : secondaryTextLight,
      textAlign: 'center',
      lineHeight: baseFontSize * 1.5,
    },
    // --- タスクアイテム関連 ---
    taskItemContainer: { // 個々のタスクアイテムのカードスタイル（背景、余白、影など）
      backgroundColor: cardBackground,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      borderRadius: BORDER_RADIUS_MD,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...shadowStyle,
    },
    taskItem: { // タスクアイテム内の要素の配置（チェックボックス、タスク内容、時間など）
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxContainer: { // タスクのチェックボックスのタッチ領域とアイコンのパディング
      paddingRight: 14,
      paddingLeft: 2,
      paddingVertical: 8,
    },
    taskCenter: { // タスク名とメモを表示する中央のエリア
      flex: 1,
      justifyContent: 'center',
      marginRight: 10,
    },
    taskTitle: { // タスクのタイトル文字
      fontSize: baseFontSize + 0.5,
      color: isDark ? '#FFFFFF' : '#111111',
      fontWeight: '500',
      marginBottom: 2,
    },
    taskMemo: { // タスクのメモ文字
      fontSize: baseFontSize - 1.5,
      color: isDark ? secondaryTextDark : secondaryTextLight,
      marginTop: 3,
      lineHeight: baseFontSize * 1.2,
    },
    taskTime: { // (現状のTaskItem.tsxでは直接使用されていないが、時刻表示用として定義)
      fontSize: baseFontSize - 1,
    },
    taskDeadlineDisplayTextBase: { // タスクの期限表示テキストの基本スタイル
      fontSize: baseFontSize - 2,
      fontWeight: '600',
    },
    noDeadlineText: { // 「期限なし」の場合のテキストスタイル
      fontStyle: 'normal',
      fontWeight: '500',
      color: isDark ? '#999999' : '#777777',
    },
    selectionIconContainer: { // 選択モード時にタスクアイテム右端に表示される選択アイコンのコンテナ
      marginLeft: 'auto',
      paddingLeft: 12,
    },
    // --- フォルダ関連 ---
    folderContainer: { // フォルダ全体のカードスタイル（背景、余白、影など）
      marginHorizontal: 16,
      marginVertical: 12,
      backgroundColor: cardBackground,
      borderRadius: BORDER_RADIUS_LG,
      overflow: 'hidden', // 角丸を子要素にも適用するため
      ...shadowStyle,
      elevation: 4,
    },
    folderHeader: { // フォルダのヘッダー部分（フォルダ名と開閉アイコンのエリア）
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#1f1f21' : '#FFFFFF', // ヘッダーの背景色
    },
    folderHeaderSelected: { // 選択モードでフォルダが選択された時のヘッダー背景色
        backgroundColor: isDark ? dynamicSubColor + '50' : dynamicSubColor + '25',
    },
    folderName: { // フォルダ名の文字
      fontSize: baseFontSize + 1,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      flex: 1,
    },
    folderIconStyle: { // フォルダヘッダーのフォルダアイコンのスタイル
        marginRight: 10,
        marginLeft: 4,
    },
    reorderButton: { // フォルダ並び替え時の上下矢印ボタンのタッチ領域
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    folderTaskItemContainer: { // フォルダ内に表示されるタスクアイテムのコンテナスタイル
        backgroundColor: cardBackground,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? '#404040' : '#E8E8E8', // 区切り線
        paddingLeft: 20, // フォルダ内のタスクを少しインデント
    },
  });
};
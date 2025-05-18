// app/features/add/types.ts
import { ViewStyle, TextStyle, ImageStyle, StyleProp } from 'react-native';
// DeadlineSettings 型は、モーダルコンポーネントの型定義ファイルからインポートする
import type { DeadlineSettings } from './components/DeadlineSettingModal/types';

// Task や Draft はこのファイルで定義して OK
export interface Task {
  id: string;
  title: string;
  memo: string;
  deadline: string; // 簡易表示用。詳細な期限は deadlineDetails に。
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit: 'minutes' | 'hours' | 'days';
  customAmount: number;
  folder: string;
  deadlineDetails?: DeadlineSettings; // インポートした DeadlineSettings 型を使用
}

export type Draft = Task;

// AddTaskScreen 固有のスタイル型 (これはここで定義して OK)
export type AddTaskStyles = {
  folderInput: ViewStyle;
  container: ViewStyle;
  appBar: ViewStyle;
  appBarTitle: TextStyle;
  draftsButton: ViewStyle;
  draftsButtonText: TextStyle;
  label: TextStyle;
  input: TextStyle;
  pickerButton: ViewStyle;
  pickerButtonWithPreview: ViewStyle;
  addMoreButton: ViewStyle;
  addMoreButtonText: TextStyle;
  fieldWrapper: ViewStyle;
  datetimeRow: ViewStyle;
  datetimeText: TextStyle;
  dateWrapper: ViewStyle;
  timeWrapper: ViewStyle;
  notifyContainer: ViewStyle;
  notifyHeader: ViewStyle;
  notifyLabel: TextStyle;
  toggleContainer: ViewStyle;
  toggleCircle: ViewStyle;
  guideText: TextStyle;
  slotPickerRow: ViewStyle;
  slotPickerWrapper: ViewStyle;
  slotPicker: TextStyle;
  imageWrapper: ViewStyle;
  image: ImageStyle;
  previewImage: ImageStyle;
  previewWrapper: ViewStyle;
  removeIcon: ViewStyle;
  buttonRow: ViewStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  draftButton: ViewStyle;
};

export interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

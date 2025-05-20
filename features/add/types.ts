// app/features/add/types.ts
import { ViewStyle, TextStyle, ImageStyle, StyleProp } from 'react-native';
import type { DeadlineSettings } from './components/DeadlineSettingModal/types';

export interface Task {
  id: string;
  title: string;
  memo: string;
  deadline: string;
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit: 'minutes' | 'hours' | 'days';
  customAmount: number;
  folder: string;
  deadlineDetails?: DeadlineSettings;
}

export type Draft = Task;

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
  photoPreviewContainer: ViewStyle; // こちらが追加されていることを確認してください
  photoPreviewItem: ViewStyle;      // こちらが追加されていることを確認してください
  photoPreviewImage: ImageStyle;    // こちらが追加されていることを確認してください
  removeIcon: ViewStyle;
  buttonRow: ViewStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  draftButton: ViewStyle;
  // 不要になった古いスタイル定義は削除しても問題ありません
  // imageWrapper?: ViewStyle; // 例: もし残っていたら削除
  // image?: ImageStyle;     // 例: もし残っていたら削除
  // previewImage?: ImageStyle;// 例: もし残っていたら削除
  // previewWrapper?: ViewStyle;// 例: もし残っていたら削除
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
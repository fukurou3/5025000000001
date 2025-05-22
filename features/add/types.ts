// app/features/add/types.ts
import { ViewStyle, TextStyle, ImageStyle, StyleProp } from 'react-native';
import type { DeadlineSettings } from './components/DeadlineSettingModal/types';

export interface Task {
  id: string;
  title: string;
  memo: string;
  deadline: string; // 繰り返しタスクの場合、最初のインスタンスの日時、または次の未完了インスタンスの日時など、表示上の主要な日時
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit: 'minutes' | 'hours' | 'days';
  customAmount: number;
  folder: string;
  deadlineDetails?: DeadlineSettings; // 繰り返しルール全体
  completedInstanceDates?: string[]; // 完了した繰り返しインスタンスの元の日付の配列 (例: "2024-05-21")
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
  photoPreviewContainer: ViewStyle;
  photoPreviewItem: ViewStyle;
  photoPreviewImage: ImageStyle;
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
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

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
}

export type Draft = Task;

export type AddTaskStyles = {
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
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}

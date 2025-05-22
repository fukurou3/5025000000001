// app/features/add/components/DeadlineSettingModal/types.ts
import type { ViewStyle, TextStyle, ColorValue } from 'react-native';
import type { FontSizeKey } from '@/context/FontSizeContext';

export interface DeadlineTime {
  hour: number;
  minute: number;
}

export interface DatePickerData {
  year: number;
  month: number;
  day: number;
}

export interface RepeatEnds {
  type: 'on_date';
  date?: string;
}

export type RepeatFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type CustomIntervalUnit = 'hours' | 'days'; // PeriodTab では使用しないが、RepeatTab のカスタムで使用

export interface DeadlineSettings {
  taskDeadlineDate?: string; // 「タスク期限」の日付
  taskDeadlineTime?: DeadlineTime; // 「タスク期限」の時刻
  isTaskDeadlineTimeEnabled?: boolean; // 「タスク期限」の時刻指定が有効か

  isPeriodSettingEnabled?: boolean; // 「期間を設定する」トグルの状態
  periodStartDate?: string; // 「期間」の開始日
  periodStartTime?: DeadlineTime; // 「期間」の開始時刻

  // 以下は繰り返し設定（RepeatTab）で使用
  taskStartTime?: DeadlineTime; // 繰り返しのタスク開始時刻
  isTaskStartTimeEnabled?: boolean; // 繰り返しのタスク開始時刻が有効か

  repeatFrequency?: RepeatFrequency;
  repeatStartDate?: string; // 繰り返しの開始日（タスク追加日とは異なる場合がある）
  repeatDaysOfWeek?: { [key: number]: boolean };
  repeatEnds?: RepeatEnds;
  isExcludeHolidays?: boolean;

  customIntervalValue?: number; // カスタム繰り返しの間隔の値
  customIntervalUnit?: CustomIntervalUnit; // カスタム繰り返しの間隔の単位
}


export interface DeadlineRoute {
  key: string;
  title: string;
}

export type CalendarFontWeight = TextStyle['fontWeight'];

export interface DeadlineModalStyles {
  overlay: ViewStyle;
  container: ViewStyle;
  headerContainer: ViewStyle;
  headerText: TextStyle;
  footer: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  tabBarContainer: ViewStyle;
  tabBar: ViewStyle;
  tabItem: ViewStyle;
  tabItemActive: ViewStyle;
  tabItemInactive: ViewStyle;
  tabLabel: TextStyle;
  tabLabelActive: TextStyle;
  tabLabelInactive: TextStyle;
  tabIndicator: ViewStyle;
  tabContentContainer: ViewStyle;
  label: TextStyle;
  settingRow: ViewStyle;
  settingRowNoBottomBorder?: ViewStyle;
  timePickerToggleContainer: ViewStyle;
  timePickerContainer: ViewStyle;
  wheelPickerWrapper: ViewStyle;
  timeSeparator: TextStyle;
  frequencyPickerContainer: ViewStyle;
  weekdaySelectorContainer?: ViewStyle;
  daySelector: ViewStyle;
  daySelectorSelected: ViewStyle;
  daySelectorText: TextStyle;
  daySelectorTextSelected: TextStyle;
  repeatEndText: TextStyle;
  calendarOverlay: ViewStyle;
  calendarInModalContainer: ViewStyle;
  clearRepeatEndDateButton: ViewStyle;
  // periodButtonContainer: ViewStyle; // 削除
  // periodButton: ViewStyle; // 削除
  // periodButtonSelected: ViewStyle; // 削除
  // periodButtonText: TextStyle; // 削除
  // periodButtonTextSelected: TextStyle; // 削除
  pickerText: TextStyle;
  textInput: ViewStyle;
  modal: ViewStyle;
  timePickerModalContainer?: ViewStyle;
  timePickerContentContainer?: ViewStyle;
  pickerRowSeparator?: ViewStyle;
  timePickerModalFooter?: ViewStyle;
  timePickerModalButton?: ViewStyle;
  sectionTitle?: TextStyle;
  sectionHeaderText?: TextStyle;
  settingRowLabelNormalColor?: TextStyle;
  exclusionSettingRow?: ViewStyle;
  exclusionValueText?: TextStyle;
  switchContainer?: ViewStyle;
  modalContent?: ViewStyle;
  modalOptionButton?: ViewStyle;
  modalOptionText?: TextStyle;
  pickerContainer?: ViewStyle;
  pickerColumn?: ViewStyle;
  pickerLabel?: TextStyle;

  customIntervalModalContainer?: ViewStyle; // RepeatTabのカスタムインターバルモーダル用
  customIntervalPickerContainer?: ViewStyle; // RepeatTabのカスタムインターバルモーダル用
  customIntervalInput?: TextStyle; // RepeatTabのカスタムインターバルモーダル用

  dateSectionSeparator?: ViewStyle; // DateSelectionTabの区切り線用
}

export interface SpecificDateSelectionTabProps {
  styles: DeadlineModalStyles;
  selectedTaskDeadlineDate?: string;
  selectedTaskDeadlineTime?: DeadlineTime;
  isTaskDeadlineTimeEnabled?: boolean;
  isPeriodSettingEnabled?: boolean;
  selectedPeriodStartDate?: string;
  selectedPeriodStartTime?: DeadlineTime;
  updateSettings: <K extends keyof Pick<DeadlineSettings,
    'taskDeadlineDate' |
    'taskDeadlineTime' |
    'isTaskDeadlineTimeEnabled' |
    'isPeriodSettingEnabled' |
    'periodStartDate' |
    'periodStartTime'
  >>(
    key: K,
    value: Pick<DeadlineSettings,
      'taskDeadlineDate' |
      'taskDeadlineTime' |
      'isTaskDeadlineTimeEnabled' |
      'isPeriodSettingEnabled' |
      'periodStartDate' |
      'periodStartTime'
    >[K]
  ) => void;
  showErrorAlert: (message: string) => void;
}


export interface SpecificRepeatTabProps {
  styles: DeadlineModalStyles;
  settings: Pick<
    DeadlineSettings,
    | 'taskStartTime'
    | 'isTaskStartTimeEnabled'
    | 'repeatFrequency'
    | 'repeatStartDate'
    | 'repeatDaysOfWeek'
    | 'isExcludeHolidays'
    | 'repeatEnds'
    | 'customIntervalValue'
    | 'customIntervalUnit'
  >;
  updateSettings: <
    K extends keyof Pick<
      DeadlineSettings,
      | 'taskStartTime'
      | 'isTaskStartTimeEnabled'
      | 'repeatFrequency'
      | 'repeatStartDate'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
      | 'customIntervalValue'
      | 'customIntervalUnit'
    >
  >(
    key: K,
    value: Pick<
      DeadlineSettings,
      | 'taskStartTime'
      | 'isTaskStartTimeEnabled'
      | 'repeatFrequency'
      | 'repeatStartDate'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
      | 'customIntervalValue'
      | 'customIntervalUnit'
    >[K]
  ) => void;
  updateFullSettings: (
    newSettings: Partial<
      Pick<
        DeadlineSettings,
        | 'taskStartTime'
        | 'isTaskStartTimeEnabled'
        | 'repeatFrequency'
        | 'repeatStartDate'
        | 'repeatDaysOfWeek'
        | 'isExcludeHolidays'
        | 'repeatEnds'
        | 'customIntervalValue'
        | 'customIntervalUnit'
      >
    >
  ) => void;
  showErrorAlert: (message: string) => void;
}

export type AmPm = 'AM' | 'PM';

export const ampmData: { labelKey: Extract<CommonTranslationKey, 'am' | 'pm'>; value: AmPm }[] = [
  { labelKey: 'am', value: 'AM' },
  { labelKey: 'pm', value: 'PM' },
];

export const hourData12 = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));

export const createMinuteData = (): Array<{ label: string; value: number }> => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({ label: i < 10 ? `0${i}` : `${i}`, value: i });
  }
  return data;
};
export const minuteDataFull = createMinuteData();


export const isHoliday = (dateString: string): boolean => {
  return false;
};

export type DeadlineModalTranslationKey =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'
  | 'ends_on_date'
  | 'repeat_frequency'
  | 'task_start_time_label'
  | 'days_of_week'
  | 'weekdays'
  | 'exclude_holidays'
  | 'exclude_holidays_jp_only'
  | 'end_repeat_title'
  | 'repeat_start_date_label'
  | 'specify_time'
  | 'specify_date'
  | 'specify_date_label'
  // | 'start_date' // `DateSelectionTab`で `deadline_modal.date_label` または `deadline_modal.start_date_label` を使用
  // | 'end_date'   // `DateSelectionTab`で `deadline_modal.date_label` を使用
  | 'not_selected'
  | 'title_display_datetime'
  | 'title_display_no_time'
  | 'title_display_no_deadline'
  | 'title_display'
  | 'tab_date'
  | 'tab_repeat'
  // | 'period_start_date_display' // 削除 (DateSelectionTab内で直接フォーマット)
  // | 'period_end_date_display' // 削除 (DateSelectionTab内で直接フォーマット)
  | 'unset_confirm_message'
  | 'period_date_missing_alert_title'
  | 'period_date_missing_alert_message'
  | 'period_start_date_missing_alert_message'
  // | 'period_end_date_missing_alert_message' // 削除済み (現在はタスク期限のみ)
  | 'repeat_start_date_missing_alert_message'
  | 'repeat_start_must_be_before_end_alert_message'
  | 'date_label_header'
  | 'time_label_header'
  // | 'task_duration_label' // 削除
  // | 'set_task_duration_title' // 削除
  | 'date_missing_for_time_alert_message'
  | 'weekly_day_missing_alert_message'
  | 'period_start_must_be_before_deadline_alert_message' // 新規追加
  | 'period_start_time_must_be_before_deadline_time_alert_message' // 新規追加
  | 'custom_interval'
  | 'set_custom_interval'
  | 'enter_interval_value'
  | 'select_interval_unit'
  | 'error_invalid_interval_value'
  | 'interval_not_set'
  | 'every_x_hours'
  | 'every_x_days'
  | 'task_deadline_section_title' // 新規追加 (タスク期限セクションのタイトル)
  | 'date_label' // 新規追加 (タスク期限の日付ラベル)
  | 'time_label' // 新規追加 (タスク期限の時刻ラベル)
  | 'set_period_toggle_label' // 新規追加 (期間を設定するトグルのラベル)
  | 'start_date_label' // 新規追加 (期間の開始日ラベル)
  | 'start_date_required_for_time' // 新規追加 (期間の開始時刻を設定する際に開始日が必要な旨のアラート)
  ;


export type CommonTranslationKey =
  | 'am'
  | 'pm'
  | 'sun_short' | 'mon_short' | 'tue_short' | 'wed_short' | 'thu_short' | 'fri_short' | 'sat_short'
  | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  | 'jan_short' | 'feb_short' | 'mar_short' | 'apr_short' | 'may_short' | 'jun_short'
  | 'jul_short' | 'aug_short' | 'sep_short' | 'oct_short' | 'nov_short' | 'dec_short'
  | 'year_unit' | 'month_unit' | 'day_unit' | 'hour_unit' | 'minute_unit'
  | 'clear'
  | 'clear_date'
  | 'clear_start_date'
  | 'clear_end_date'
  | 'ok'
  | 'save'
  | 'cancel'
  | 'select'
  | 'not_set'
  | 'today'
  | 'settings_not_implemented'
  | 'year_month_format'
  | 'all_day'
  | 'to'
  | 'unset'
  | 'notification_title'
  | 'minutes_unit_after'
  | 'hours_unit_after'
  | 'days_unit_after'
  | 'months_unit_after'
  | 'years_unit_after'
  // | 'clear_duration' // 削除
  | 'hours'
  | 'days'
  | 'month_day_format'; // 例: "M月D日"
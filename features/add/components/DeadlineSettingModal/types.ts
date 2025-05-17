// app/features/add/components/DeadlineSettingModal/types.ts
import type { ViewStyle, TextStyle, ColorValue } from 'react-native';
import type { FontSizeKey } from '@/context/FontSizeContext';

export interface DeadlineTime {
  hour: number;
  minute: number;
}

export interface RepeatEnds {
  type: 'never' | 'on_date' | 'after_occurrences';
  date?: string;
  occurrences?: number;
}

export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DeadlineSettings {
  // ... (変更なし)
  date?: string;
  time?: DeadlineTime;
  isTimeEnabled?: boolean;
  repeatFrequency?: RepeatFrequency;
  repeatInterval?: number;
  repeatDaysOfWeek?: { [key: number]: boolean };
  repeatOnDate?: { day?: number; month?: number; weekOfMonth?: number; dayOfWeek?: number };
  repeatEnds?: RepeatEnds;
  isExcludeHolidays?: boolean;
  periodStartDate?: string;
  periodEndDate?: string;
}

export interface DeadlineRoute {
  key: string;
  title: string;
}

export type CalendarFontWeight = TextStyle['fontWeight'];

export interface DeadlineModalStyles {
  // ... (既存のスタイルキーは変更なし)
  overlay: ViewStyle;
  container: ViewStyle;
  headerContainer: ViewStyle;
  headerText: TextStyle;
  footer: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  tabBar: ViewStyle;
  tabLabel: TextStyle;
  tabIndicator: ViewStyle;
  tabContentContainer: ViewStyle;
  label: TextStyle;
  settingRow: ViewStyle;
  timePickerToggleContainer: ViewStyle;
  timePickerContainer: ViewStyle;
  wheelPickerWrapper: ViewStyle;
  timeSeparator: TextStyle;
  frequencyPickerContainer: ViewStyle;
  intervalContainer: ViewStyle;
  intervalInput: ViewStyle;
  intervalText: TextStyle;
  weekDaysContainer: ViewStyle;
  daySelector: ViewStyle;
  daySelectorSelected: ViewStyle;
  daySelectorText: TextStyle;
  daySelectorTextSelected: TextStyle;
  repeatEndOption: ViewStyle;
  repeatEndOptionSelected: ViewStyle;
  repeatEndText: TextStyle;
  calendarOverlay: ViewStyle;
  calendarInModalContainer: ViewStyle;
  clearRepeatEndDateButton: ViewStyle;
  periodButtonContainer: ViewStyle;
  periodButton: ViewStyle;
  periodButtonSelected: ViewStyle;
  periodButtonText: TextStyle;
  periodButtonTextSelected: TextStyle;
  pickerText: TextStyle;
  textInput: ViewStyle;
  modal: ViewStyle;

  // TimePickerModal 用のスタイルキー
  timePickerModalContainer?: ViewStyle;
  timePickerContentContainer?: ViewStyle; // 追加: ヘッダー、ピッカー、フッターを包括するコンテナ用
  pickerRowSeparator?: ViewStyle;        // 追加: ピッカー選択行の上下の区切り線用
  timePickerModalFooter?: ViewStyle;
  timePickerModalButton?: ViewStyle;
}

// ... (Specific props, AmPm, data arrays, translation keys は変更なし)
export interface SpecificDateSelectionTabProps {
  styles: DeadlineModalStyles;
  selectedDate?: string;
  selectedTime?: DeadlineTime;
  isTimeEnabled?: boolean;
  updateSettings: <K extends keyof Pick<DeadlineSettings, 'date' | 'time' | 'isTimeEnabled'>>(
    key: K,
    value: Pick<DeadlineSettings, 'date' | 'time' | 'isTimeEnabled'>[K]
  ) => void;
}

export interface SpecificRepeatTabProps {
  styles: DeadlineModalStyles;
  settings: Pick<
    DeadlineSettings,
    | 'repeatFrequency'
    | 'repeatInterval'
    | 'repeatDaysOfWeek'
    | 'isExcludeHolidays'
    | 'repeatEnds'
  >;
  updateSettings: <
    K extends keyof Pick<
      DeadlineSettings,
      | 'repeatFrequency'
      | 'repeatInterval'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
    >
  >(
    key: K,
    value: Pick<
      DeadlineSettings,
      | 'repeatFrequency'
      | 'repeatInterval'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
    >[K]
  ) => void;
  updateFullSettings: (
    newSettings: Partial<
      Pick<
        DeadlineSettings,
        | 'repeatFrequency'
        | 'repeatInterval'
        | 'repeatDaysOfWeek'
        | 'isExcludeHolidays'
        | 'repeatEnds'
      >
    >
  ) => void;
}

export interface SpecificPeriodTabProps {
  styles: DeadlineModalStyles;
  periodStartDate?: string;
  periodEndDate?: string;
  updateSettings: <K extends keyof Pick<DeadlineSettings, 'periodStartDate' | 'periodEndDate'>>(
    key: K,
    value: Pick<DeadlineSettings, 'periodStartDate' | 'periodEndDate'>[K]
  ) => void;
}

export type AmPm = 'AM' | 'PM';

export const ampmData: { labelKey: Extract<CommonTranslationKey, 'am' | 'pm'>; value: AmPm }[] = [
  { labelKey: 'am', value: 'AM' },
  { labelKey: 'pm', value: 'PM' },
];

export const hourData12 = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
export const minuteData = Array.from({ length: 60 / 5 }, (_, i) => ({
  label: `${String(i * 5).padStart(2, '0')}`,
  value: i * 5,
}));

export const isHoliday = (dateString: string): boolean => {
  return false;
};

export type DeadlineModalTranslationKey =
  | 'no_repeat'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'every_x_days'
  | 'every_x_weeks'
  | 'every_x_months'
  | 'every_x_years'
  | 'ends_never'
  | 'ends_on_date'
  | 'ends_after_occurrences'
  | 'repeat_frequency'
  | 'interval'
  | 'days_of_week'
  | 'exclude_holidays'
  | 'end_repeat_title'
  | 'occurrences_suffix'
  | 'specify_time'
  | 'start_date'
  | 'end_date'
  | 'not_selected'
  | 'title_display_datetime'
  | 'title_display_no_time'
  | 'title_display_no_deadline'
  | 'title_display'
  | 'tab_date'
  | 'tab_repeat'
  | 'tab_period'
  | 'period_start_date_display'
  | 'period_end_date_display'
  | 'unset_confirm_message';


export type CommonTranslationKey =
  | 'am'
  | 'pm'
  | 'sun_short'
  | 'mon_short'
  | 'tue_short'
  | 'wed_short'
  | 'thu_short'
  | 'fri_short'
  | 'sat_short'
  | 'none'
  | 'clear'
  | 'ok'
  | 'save'
  | 'cancel'
  | 'select'
  | 'year_month_format'
  | 'all_day'
  | 'to'
  | 'unset';
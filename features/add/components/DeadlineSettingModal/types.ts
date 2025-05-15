// app/features/add/components/DeadlineSettingModal/types.ts
import type { ViewStyle, TextStyle } from 'react-native';
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
  contentBackgroundColor: ViewStyle['backgroundColor'];
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
}

// タブ固有のProps型定義
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

// CommonTabProps は直接使用されなくなる可能性がありますが、参考のために残すか、削除します。
// export interface CommonTabProps {
//   styles: DeadlineModalStyles;
//   settings: DeadlineSettings;
//   updateSettings: <K extends keyof DeadlineSettings>(key: K, value: DeadlineSettings[K]) => void;
//   updateFullSettings: (newSettings: Partial<DeadlineSettings>) => void;
// }
// export interface DateSelectionTabProps extends CommonTabProps {} // <- これらは Specific***Props に置き換わる
// export interface RepeatTabProps extends CommonTabProps {}
// export interface PeriodTabProps extends CommonTabProps {}


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
  | 'period_end_date_display';


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
  | 'to';
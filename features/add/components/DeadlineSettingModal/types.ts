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

export type DurationUnit = 'minutes' | 'hours' | 'days' | 'months' | 'years';

export interface AmountAndUnit {
  amount: number;
  unit: DurationUnit;
}

export interface DeadlineSettings {
  date?: string;
  time?: DeadlineTime;
  isTimeEnabled?: boolean;

  taskStartTime?: DeadlineTime;
  isTaskStartTimeEnabled?: boolean;
  taskDuration?: AmountAndUnit;

  repeatFrequency?: RepeatFrequency;
  repeatStartDate?: string;
  repeatDaysOfWeek?: { [key: number]: boolean };
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
  periodButtonContainer: ViewStyle;
  periodButton: ViewStyle;
  periodButtonSelected: ViewStyle;
  periodButtonText: TextStyle;
  periodButtonTextSelected: TextStyle;
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
}


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
    | 'taskStartTime'
    | 'isTaskStartTimeEnabled'
    | 'taskDuration'
    | 'repeatFrequency'
    | 'repeatStartDate'
    | 'repeatDaysOfWeek'
    | 'isExcludeHolidays'
    | 'repeatEnds'
  >;
  updateSettings: <
    K extends keyof Pick<
      DeadlineSettings,
      | 'taskStartTime'
      | 'isTaskStartTimeEnabled'
      | 'taskDuration'
      | 'repeatFrequency'
      | 'repeatStartDate'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
    >
  >(
    key: K,
    value: Pick<
      DeadlineSettings,
      | 'taskStartTime'
      | 'isTaskStartTimeEnabled'
      | 'taskDuration'
      | 'repeatFrequency'
      | 'repeatStartDate'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
    >[K]
  ) => void;
  updateFullSettings: (
    newSettings: Partial<
      Pick<
        DeadlineSettings,
        | 'taskStartTime'
        | 'isTaskStartTimeEnabled'
        | 'taskDuration'
        | 'repeatFrequency'
        | 'repeatStartDate'
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

export interface DurationOption {
  label: string;
  value: number;
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
  | 'task_duration_label'
  | 'set_task_duration_title'
  | 'days_of_week'
  | 'weekdays'
  | 'exclude_holidays'
  | 'exclude_holidays_jp_only'
  | 'end_repeat_title'
  | 'repeat_start_date_label'
  | 'specify_time'
  | 'specify_date'
  | 'specify_date_label'
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
  | 'unset_confirm_message'
  | 'period_start_label'
  | 'period_end_label'
  | 'period_date_missing_alert_title'
  | 'period_date_missing_alert_message'
  | 'period_start_date_missing_alert_message'
  | 'period_end_date_missing_alert_message'
  | 'repeat_start_date_missing_alert_message'
  | 'repeat_start_must_be_before_end_alert_message'
  | 'date_label_header'
  | 'time_label_header'
  | 'section_task_addition'
  | 'section_repeat_settings'
  | 'date_missing_for_time_alert_message'
  | 'weekly_day_missing_alert_message'
  | 'period_start_must_be_before_end_alert_message';

export type CommonTranslationKey =
  | 'am'
  | 'pm'
  | 'sun_short' | 'mon_short' | 'tue_short' | 'wed_short' | 'thu_short' | 'fri_short' | 'sat_short'
  | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  | 'jan_short' | 'feb_short' | 'mar_short' | 'apr_short' | 'may_short' | 'jun_short'
  | 'jul_short' | 'aug_short' | 'sep_short' | 'oct_short' | 'nov_short' | 'dec_short'
  | 'year_unit' | 'month_unit' | 'day_unit' | 'hour_unit' | 'minute_unit'
  | 'years_unit_after'
  | 'months_unit_after'
  | 'days_unit_after'
  | 'hours_unit_after'
  | 'minutes_unit_after'
  | 'clear'
  | 'clear_date'
  | 'clear_start_date'
  | 'clear_end_date'
  | 'clear_duration'
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
  | 'notification_title';
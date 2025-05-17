// app/features/add/components/DeadlineSettingModal/types.ts
import type { ViewStyle, TextStyle, ColorValue } from 'react-native';
import type { FontSizeKey } from '@/context/FontSizeContext';

export interface DeadlineTime {
  hour: number;
  minute: number;
}

export interface DatePickerData { // DatePickerModal用に新規追加
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

export interface RepeatEnds {
  type: 'never' | 'on_date' | 'after_occurrences';
  date?: string;
  occurrences?: number;
}

export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DeadlineSettings {
  date?: string; // YYYY-MM-DD
  time?: DeadlineTime;
  isTimeEnabled?: boolean;
  repeatFrequency?: RepeatFrequency;
  repeatInterval?: number;
  repeatDaysOfWeek?: { [key: number]: boolean };
  repeatOnDate?: { day?: number; month?: number; weekOfMonth?: number; dayOfWeek?: number }; // これは現状あまり使われていない可能性
  repeatEnds?: RepeatEnds;
  isExcludeHolidays?: boolean;
  periodStartDate?: string; // YYYY-MM-DD
  periodEndDate?: string;   // YYYY-MM-DD
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
  label: TextStyle;
  settingRow: ViewStyle;
  timePickerToggleContainer: ViewStyle;
  timePickerContainer: ViewStyle; // DatePickerModalでも一部流用想定
  wheelPickerWrapper: ViewStyle; // DatePickerModalでも流用想定
  timeSeparator: TextStyle;      // DatePickerModalのセパレータにも流用想定
  frequencyPickerContainer: ViewStyle;
  intervalContainer: ViewStyle;
  intervalInput: ViewStyle; // または TextStyle/ViewStyle の組み合わせ
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
  textInput: ViewStyle; // 汎用的なテキスト入力スタイルがあれば
  modal: ViewStyle; // react-native-modal の style prop 用

  timePickerModalContainer?: ViewStyle; // DatePickerModalでも流用
  timePickerContentContainer?: ViewStyle;
  pickerRowSeparator?: ViewStyle;
  timePickerModalFooter?: ViewStyle; // DatePickerModalでも流用
  timePickerModalButton?: ViewStyle; // DatePickerModalでも流用
}


export interface SpecificDateSelectionTabProps {
  styles: DeadlineModalStyles;
  selectedDate?: string; // YYYY-MM-DD
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
    // | 'repeatOnDate' // 必要であれば追加
  >;
  updateSettings: <
    K extends keyof Pick<
      DeadlineSettings,
      | 'repeatFrequency'
      | 'repeatInterval'
      | 'repeatDaysOfWeek'
      | 'isExcludeHolidays'
      | 'repeatEnds'
      // | 'repeatOnDate'
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
      // | 'repeatOnDate'
    >[K]
  ) => void;
  updateFullSettings: ( // 複数の設定を一度に更新する場合
    newSettings: Partial<
      Pick<
        DeadlineSettings,
        | 'repeatFrequency'
        | 'repeatInterval'
        | 'repeatDaysOfWeek'
        | 'isExcludeHolidays'
        | 'repeatEnds'
        // | 'repeatOnDate'
      >
    >
  ) => void;
}

export interface SpecificPeriodTabProps {
  styles: DeadlineModalStyles;
  periodStartDate?: string; // YYYY-MM-DD
  periodEndDate?: string;   // YYYY-MM-DD
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

// 分のデータ生成 (TimePickerModal.tsx から移動・共通化も検討)
export const createMinuteData = (): Array<{ label: string; value: number }> => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({ label: i < 10 ? `0${i}` : `${i}`, value: i });
  }
  return data;
};
export const minuteDataFull = createMinuteData(); // TimePickerModal で使用


// isHoliday は現状使われていないが、将来的に復活する可能性を考慮して残す
export const isHoliday = (dateString: string): boolean => {
  // 実際には祝日判定ロジックを実装
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
  // | 'every_x_months' // 翻訳キーが不足していれば追加
  // | 'every_x_years'
  | 'ends_never'
  | 'ends_on_date'
  | 'ends_after_occurrences'
  | 'repeat_frequency'
  | 'interval'
  | 'days_of_week' // もし翻訳ファイルにない場合は追加
  | 'exclude_holidays'
  | 'end_repeat_title'
  | 'occurrences_suffix'
  | 'specify_time'
  | 'specify_date' // 新規追加 (DatePickerModalのヘッダー用)
  | 'specify_date_label' // 新規追加 (DateSelectionTabのラベル用)
  | 'start_date'
  | 'end_date'
  | 'not_selected'
  | 'title_display_datetime' // ヘッダー表示用 (日付と時刻)
  | 'title_display_no_time'  // ヘッダー表示用 (日付のみ)
  | 'title_display_no_deadline' // ヘッダー表示用 (期限なし)
  | 'title_display' // 汎用的な日時表示 (settings.date, settings.time を使う)
  | 'tab_date'
  | 'tab_repeat'
  | 'tab_period'
  | 'period_start_date_display' // ヘッダー表示用 (期間開始日) - 必要なら詳細化
  | 'period_end_date_display'   // ヘッダー表示用 (期間終了日) - 必要なら詳細化
  | 'unset_confirm_message';   // 確認モーダルのメッセージ


export type CommonTranslationKey =
  | 'am'
  | 'pm'
  | 'sun_short' | 'mon_short' | 'tue_short' | 'wed_short' | 'thu_short' | 'fri_short' | 'sat_short'
  | 'jan_short' | 'feb_short' | 'mar_short' | 'apr_short' | 'may_short' | 'jun_short' // 月の短縮名
  | 'jul_short' | 'aug_short' | 'sep_short' | 'oct_short' | 'nov_short' | 'dec_short'
  | 'year_unit' | 'month_unit' | 'day_unit' // DatePickerModal用
  | 'none' // 汎用的な「なし」
  | 'clear'
  | 'clear_date' // DatePickerModal用
  | 'clear_start_date' // PeriodTab -> DatePickerModal用
  | 'clear_end_date'   // PeriodTab -> DatePickerModal用
  | 'ok'
  | 'save'
  | 'cancel'
  | 'select' // 汎用的な「選択」
  | 'year_month_format' // YYYY年MM月のようなフォーマット (現状カレンダーヘッダでは不使用)
  | 'all_day' // 終日
  | 'to'      // 期間表示用 (例: X to Y)
  | 'unset';  // 設定しない
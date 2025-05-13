// app/features/add/components/DeadlineSettingModal/DeadlineModalHeader.tsx
import React, { useMemo, useCallback } from 'react'; // useMemo, useCallback をインポート
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DeadlineSettings, AmPm, DeadlineModalStyles, CommonTranslationKey } from './types'; // CommonTranslationKey をインポート

interface DeadlineModalHeaderProps {
  settings: DeadlineSettings;
  styles: DeadlineModalStyles;
  activeTabIndex: number;
}

const formatHour12 = (hour24: number): number => {
  if (hour24 === 0) return 12; // 深夜0時は12 AM
  if (hour24 > 12) return hour24 - 12;
  return hour24;
};

const getAmPm = (hour24: number): AmPm => {
  // 0時から11時59分までをAMとする (24時は0時として扱う)
  return hour24 >= 0 && hour24 < 12 ? 'AM' : 'PM';
};

// ★ HeaderコンポーネントをReact.memoでラップ
export const DeadlineModalHeader = React.memo<DeadlineModalHeaderProps>(({ settings, styles, activeTabIndex }) => {
  const { t } = useTranslation();

  // formatDate と formatTime を useCallback でメモ化
  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return '';
    // 必要であればここで日付のフォーマット変換 (例: YYYY-MM-DD -> MM/DD/YYYY) を行う
    // 現在はそのまま返している
    return dateString;
  }, []);

  const formatTime = useCallback((time?: { hour: number; minute: number }): string => {
    if (!time) return '';
    const ampm = getAmPm(time.hour);
    const hour12 = formatHour12(time.hour);
    const ampmKey = ampm.toLowerCase() as Extract<CommonTranslationKey, 'am' | 'pm'>; // 型アサーション
    return `${t(`common.${ampmKey}`)} ${hour12}:${String(time.minute).padStart(2, '0')}`;
  }, [t]); // t (翻訳関数) が変わることは通常ないが、依存配列に含める

  // ★ displayText の計算を useMemo でラップ
  const displayText = useMemo(() => {
    let textValue = t('deadline_modal.title_display_no_deadline'); // デフォルト値

    // アクティブなタブに基づいて表示内容を決定
    if (activeTabIndex === 0) { // 「日付」タブ
      if (settings.date) {
        if (settings.isTimeEnabled && settings.time) {
          textValue = t('deadline_modal.title_display', {
            date: formatDate(settings.date),
            time: formatTime(settings.time),
          });
        } else {
          textValue = t('deadline_modal.title_display_no_time', { // 終日扱いの場合のキーを検討 (または単に日付のみ)
            date: formatDate(settings.date),
            // time: t('common.all_day') のようなキーも使えるかも
          });
        }
      }
      // 日付タブがアクティブで日付未設定の場合はデフォルトの textValue のまま
    } else if (activeTabIndex === 2) { // 「期間」タブ
      if (settings.periodStartDate) {
        let periodText = formatDate(settings.periodStartDate);
        if (settings.periodEndDate && settings.periodStartDate !== settings.periodEndDate) {
          periodText += ` ${t('common.to')} ${formatDate(settings.periodEndDate)}`;
        }
        // periodText が空でなければ更新 (開始日のみでも表示)
        if (periodText.trim() !== '') textValue = periodText;
      }
      // 期間タブがアクティブで期間未設定の場合はデフォルトの textValue のまま
    } else if (activeTabIndex === 1) { // 「繰り返し」タブ
      // 繰り返しタブでは、まず期間があれば期間を、なければ単一日付を表示、どちらもなければデフォルト
      if (settings.periodStartDate) {
        let periodText = formatDate(settings.periodStartDate);
        if (settings.periodEndDate && settings.periodStartDate !== settings.periodEndDate) {
          periodText += ` ${t('common.to')} ${formatDate(settings.periodEndDate)}`;
        }
        if (periodText.trim() !== '') textValue = periodText;
      } else if (settings.date) {
        if (settings.isTimeEnabled && settings.time) {
          textValue = t('deadline_modal.title_display', {
            date: formatDate(settings.date),
            time: formatTime(settings.time),
          });
        } else {
          textValue = t('deadline_modal.title_display_no_time', {
            date: formatDate(settings.date),
          });
        }
      }
      // 繰り返しタブで期間も日付も未設定の場合はデフォルトの textValue のまま
    }

    // 最終的なフォールバック: どのタブを見ているかに関わらず、
    // date も periodStartDate も両方未設定なら「期限を設定」にする。
    // (上記ロジックで既にカバーされているはずだが、念のため)
    if (!settings.date && !settings.periodStartDate) {
      textValue = t('deadline_modal.title_display_no_deadline');
    }

    return textValue;
  }, [
    activeTabIndex,
    settings.date,
    settings.isTimeEnabled,
    settings.time?.hour, // オブジェクトではなく、具体的な値に依存
    settings.time?.minute,
    settings.periodStartDate,
    settings.periodEndDate,
    t,
    formatDate, // メモ化された関数も依存配列に
    formatTime  // メモ化された関数も依存配列に
  ]);

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
        {displayText}
      </Text>
    </View>
  );
});
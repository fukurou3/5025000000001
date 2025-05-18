// app/features/add/components/DeadlineSettingModal/DeadlineModalHeader.tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DeadlineSettings, AmPm, DeadlineModalStyles, CommonTranslationKey } from './types';

interface DeadlineModalHeaderProps {
  settings: DeadlineSettings;
  styles: DeadlineModalStyles;
  activeTabIndex: number;
}

const formatHour12 = (hour24: number): number => {
  if (hour24 === 0) return 12;
  if (hour24 > 12) return hour24 - 12;
  return hour24;
};

const getAmPm = (hour24: number): AmPm => {
  return hour24 >= 0 && hour24 < 12 ? 'AM' : 'PM';
};

const DeadlineModalHeaderLogic: React.FC<DeadlineModalHeaderProps> = ({ settings, styles, activeTabIndex }) => {
  const { t } = useTranslation();

  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return t('common.not_set', '未設定');
    return dateString;
  }, [t]);

  const formatTime = useCallback((time?: { hour: number; minute: number }): string => {
    if (!time) return '';
    const ampm = getAmPm(time.hour);
    const hour12 = formatHour12(time.hour);
    const ampmKey = ampm.toLowerCase() as Extract<CommonTranslationKey, 'am' | 'pm'>;
    return `${t(`common.${ampmKey}`)} ${hour12}:${String(time.minute).padStart(2, '0')}`;
  }, [t]);

  const headerContent = useMemo(() => {
    const notSetText = t('common.not_set', '未設定');

    // MODIFIED: Date Tab (activeTabIndex === 0) display logic
    if (activeTabIndex === 0) {
      const dateLabel = t('deadline_modal.date_label_header', '日付');
      const timeLabel = t('deadline_modal.time_label_header', '時間');
      
      const dateValueDisplay = settings.date ? formatDate(settings.date) : notSetText;
      let timeValueDisplay;

      if (settings.date) { // Time is only relevant if a date is set
        timeValueDisplay = (settings.isTimeEnabled && settings.time) ? formatTime(settings.time) : notSetText;
      } else {
        timeValueDisplay = notSetText; // If no date, time is also "not set" for display
      }

      return (
        <>
          <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
            {`${dateLabel}: ${dateValueDisplay}`}
          </Text>
          <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
            {`${timeLabel}: ${timeValueDisplay}`}
          </Text>
        </>
      );
    } 
    // MODIFIED: Period Tab (activeTabIndex === 2) OR if periodStartDate is set and not on Date tab
    else if (activeTabIndex === 2 || (settings.periodStartDate && activeTabIndex !== 0) ) {
      const startDateLabel = t('deadline_modal.period_start_label', '開始');
      const endDateLabel = t('deadline_modal.period_end_label', '終了');

      const startDateDisplay = settings.periodStartDate ? formatDate(settings.periodStartDate) : notSetText;
      const endDateDisplay = settings.periodEndDate ? formatDate(settings.periodEndDate) : notSetText;

      // Ensure two lines are rendered even if one is not set, to maintain layout consistency with Date tab
      return (
        <>
          <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
            {`${startDateLabel}: ${startDateDisplay}`}
          </Text>
          <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
            {`${endDateLabel}: ${endDateDisplay}`}
          </Text>
        </>
      );
    }
    // Fallback for other tabs (e.g., Repeat tab) or when no specific two-line display is needed
    else {
      if (settings.date) {
        const dateDisplay = formatDate(settings.date);
        if (settings.isTimeEnabled && settings.time) {
          return (
            <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
              {t('deadline_modal.title_display', { date: dateDisplay, time: formatTime(settings.time) })}
            </Text>
          );
        } else {
          return (
            <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
              {t('deadline_modal.title_display_no_time', { date: dateDisplay })}
            </Text>
          );
        }
      }
    }

    // Default fallback if nothing is set
    return (
      <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
        {t('deadline_modal.title_display_no_deadline', '期限設定なし')}
      </Text>
    );
  }, [
    activeTabIndex,
    settings.date,
    settings.isTimeEnabled,
    settings.time,
    settings.periodStartDate,
    settings.periodEndDate,
    t,
    formatDate,
    formatTime,
    styles.headerText
  ]);

  return (
    <View style={styles.headerContainer}>
      {headerContent}
    </View>
  );
};

export const DeadlineModalHeader = React.memo(DeadlineModalHeaderLogic);
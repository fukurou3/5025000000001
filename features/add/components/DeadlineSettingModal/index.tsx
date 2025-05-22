// app/features/add/components/DeadlineSettingModal/index.tsx
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { View, TouchableOpacity, Text, useWindowDimensions, Platform, InteractionManager } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneRendererProps, TabBarProps } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { CalendarUtils } from 'react-native-calendars';

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import type {
    DeadlineSettings,
    DeadlineTime,
    DeadlineRoute,
    SpecificDateSelectionTabProps,
    SpecificRepeatTabProps,
} from './types';
import { createDeadlineModalStyles } from './styles';
import { DeadlineModalHeader } from './DeadlineModalHeader';
import { DateSelectionTab } from './DateSelectionTab';
import { RepeatTab } from './RepeatTab';
import { ConfirmModal } from './ConfirmModal';

interface DeadlineSettingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings?: DeadlineSettings) => void;
  initialSettings?: DeadlineSettings;
}

const getSafeTimeWithDefault = (time?: DeadlineTime): DeadlineTime => {
  const now = new Date();
  return {
    hour: time?.hour ?? now.getHours(),
    minute: time?.minute ?? now.getMinutes(),
  };
}

const todayString = CalendarUtils.getCalendarDateString(new Date());
const ANIMATION_TIMING = 250;
const BACKDROP_OPACITY = 0.4;

const getDefaultInitialSettings = (): DeadlineSettings => {
    const now = new Date();
    return {
      taskDeadlineDate: undefined,
      taskDeadlineTime: undefined,
      isTaskDeadlineTimeEnabled: false,
      isPeriodSettingEnabled: false,
      periodStartDate: undefined,
      periodStartTime: undefined,

      taskStartTime: { hour: now.getHours(), minute: now.getMinutes() },
      isTaskStartTimeEnabled: false,

      repeatFrequency: undefined,
      repeatStartDate: todayString,
      repeatDaysOfWeek: undefined,
      repeatEnds: undefined,
      isExcludeHolidays: false,
      customIntervalValue: 1,
      customIntervalUnit: 'days',
    };
};


export const DeadlineSettingModal: React.FC<DeadlineSettingModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const layout = useWindowDimensions();
  const styles = useMemo(() => createDeadlineModalStyles(isDark, subColor, fontSizeKey, layout.height), [isDark, subColor, fontSizeKey, layout.height]);
  const { t } = useTranslation();


  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [settings, setSettings] = useState<DeadlineSettings>(getDefaultInitialSettings);

  const [isUnsetConfirmVisible, setUnsetConfirmVisible] = useState(false);
  const [isValidationErrorModalVisible, setValidationErrorModalVisible] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');


  useEffect(() => {
    if (visible) {
      InteractionManager.runAfterInteractions(() => {
        const defaults = getDefaultInitialSettings();
        let effectiveInitialSettings = { ...defaults };

        if (initialSettings) {
           effectiveInitialSettings = {
            ...defaults,
            taskDeadlineDate: initialSettings.taskDeadlineDate,
            taskDeadlineTime: initialSettings.taskDeadlineTime,
            isTaskDeadlineTimeEnabled: initialSettings.isTaskDeadlineTimeEnabled,
            isPeriodSettingEnabled: initialSettings.isPeriodSettingEnabled,
            periodStartDate: initialSettings.periodStartDate,
            periodStartTime: initialSettings.periodStartTime,

            taskStartTime: getSafeTimeWithDefault(initialSettings.taskStartTime),
            isTaskStartTimeEnabled: initialSettings.isTaskStartTimeEnabled ?? defaults.isTaskStartTimeEnabled,
            repeatFrequency: initialSettings.repeatFrequency,
            repeatStartDate: initialSettings.repeatStartDate || defaults.repeatStartDate,
            repeatDaysOfWeek: initialSettings.repeatDaysOfWeek,
            repeatEnds: initialSettings.repeatEnds,
            isExcludeHolidays: initialSettings.isExcludeHolidays ?? defaults.isExcludeHolidays,
            customIntervalValue: initialSettings.customIntervalValue || defaults.customIntervalValue,
            customIntervalUnit: initialSettings.customIntervalUnit || defaults.customIntervalUnit,
          };
           if (initialSettings.isTaskDeadlineTimeEnabled === true && initialSettings.taskDeadlineTime === undefined) {
            effectiveInitialSettings.taskDeadlineTime = defaults.taskDeadlineTime; // Ensure time is set if enabled
           }
        }
        setSettings(effectiveInitialSettings);

        if (effectiveInitialSettings.repeatFrequency) {
            setActiveTabIndex(1);
        } else {
            setActiveTabIndex(0);
        }
      });
    } else {
        setValidationErrorModalVisible(false);
        setValidationErrorMessage('');
    }
  }, [visible, initialSettings]);

  const updateSettingsCallback = useCallback(
    <K extends keyof DeadlineSettings>(key: K, value: DeadlineSettings[K]) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    }, []
  );

  const updateFullSettings = useCallback((newSettings: Partial<DeadlineSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const showErrorAlert = useCallback((message: string) => {
    setValidationErrorMessage(message);
    setValidationErrorModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    if (activeTabIndex === 0) { // 日付・期間タブ
        if (settings.isPeriodSettingEnabled) { // 期間設定が有効な場合
            if (!settings.periodStartDate) {
                showErrorAlert(t('deadline_modal.period_start_date_missing_alert_message'));
                return;
            }
            if (settings.taskDeadlineDate && settings.periodStartDate > settings.taskDeadlineDate) {
                 showErrorAlert(t('deadline_modal.period_start_must_be_before_deadline_alert_message'));
                 return;
            }
             if (settings.taskDeadlineDate && settings.periodStartDate === settings.taskDeadlineDate && settings.periodStartTime && settings.taskDeadlineTime &&
                (settings.periodStartTime.hour > settings.taskDeadlineTime.hour ||
                 (settings.periodStartTime.hour === settings.taskDeadlineTime.hour && settings.periodStartTime.minute >= settings.taskDeadlineTime.minute))) {
                showErrorAlert(t('deadline_modal.period_start_time_must_be_before_deadline_time_alert_message'));
                return;
            }
        } else { // 期間設定が無効（タスク期限のみ）
            if (settings.isTaskDeadlineTimeEnabled && !settings.taskDeadlineDate) {
                showErrorAlert(t('deadline_modal.date_missing_for_time_alert_message'));
                return;
            }
        }
    } else if (activeTabIndex === 1 && settings.repeatFrequency) { // 繰り返しタブ
        if (!settings.repeatStartDate) {
            showErrorAlert(t('deadline_modal.repeat_start_date_missing_alert_message'));
            return;
        }
        if (settings.repeatEnds?.date && settings.repeatStartDate && settings.repeatStartDate > settings.repeatEnds.date) {
            showErrorAlert(t('deadline_modal.repeat_start_must_be_before_end_alert_message'));
            return;
        }
        if (settings.repeatFrequency === 'weekly' && (!settings.repeatDaysOfWeek || Object.values(settings.repeatDaysOfWeek).every(day => !day))) {
            showErrorAlert(t('deadline_modal.weekly_day_missing_alert_message'));
            return;
        }
        if (settings.repeatFrequency === 'custom') {
            if (!settings.customIntervalValue || settings.customIntervalValue <= 0 || !settings.customIntervalUnit || !Number.isInteger(settings.customIntervalValue)) {
                showErrorAlert(t('deadline_modal.error_invalid_interval_value'));
                return;
            }
        }
    }

    let finalSettingsOutput: DeadlineSettings | undefined;

    if (activeTabIndex === 0) { // 日付・期間タブ
        if (settings.taskDeadlineDate || settings.isPeriodSettingEnabled) { // タスク期限日または期間設定が有効な場合
            finalSettingsOutput = {
                taskDeadlineDate: settings.taskDeadlineDate,
                taskDeadlineTime: settings.isTaskDeadlineTimeEnabled ? settings.taskDeadlineTime : undefined,
                isTaskDeadlineTimeEnabled: settings.isTaskDeadlineTimeEnabled,
                isPeriodSettingEnabled: settings.isPeriodSettingEnabled,
                periodStartDate: settings.isPeriodSettingEnabled ? settings.periodStartDate : undefined,
                periodStartTime: settings.isPeriodSettingEnabled ? settings.periodStartTime : undefined,
                // 繰り返し関連はクリア
                repeatFrequency: undefined,
                repeatStartDate: undefined,
                repeatDaysOfWeek: undefined,
                repeatEnds: undefined,
                isExcludeHolidays: false,
                customIntervalValue: undefined,
                customIntervalUnit: undefined,
                taskStartTime: undefined, // 繰り返し用なのでクリア
                isTaskStartTimeEnabled: false, // 繰り返し用なのでクリア
            };
        } else {
            finalSettingsOutput = undefined; // 何も設定されていない
        }
    } else if (activeTabIndex === 1) { // 繰り返しタブ
        if (settings.repeatFrequency && settings.repeatStartDate) {
            finalSettingsOutput = {
                // 日付・期間関連はクリア
                taskDeadlineDate: undefined,
                taskDeadlineTime: undefined,
                isTaskDeadlineTimeEnabled: false,
                isPeriodSettingEnabled: false,
                periodStartDate: undefined,
                periodStartTime: undefined,
                // 繰り返し関連を設定
                repeatFrequency: settings.repeatFrequency,
                repeatStartDate: settings.repeatStartDate,
                repeatDaysOfWeek: settings.repeatFrequency === 'weekly' ? settings.repeatDaysOfWeek : undefined,
                repeatEnds: settings.repeatEnds,
                isExcludeHolidays: settings.isExcludeHolidays,
                taskStartTime: settings.isTaskStartTimeEnabled ? settings.taskStartTime : undefined,
                isTaskStartTimeEnabled: settings.isTaskStartTimeEnabled,
                customIntervalValue: settings.repeatFrequency === 'custom' ? settings.customIntervalValue : undefined,
                customIntervalUnit: settings.repeatFrequency === 'custom' ? settings.customIntervalUnit : undefined,
            };
        } else {
            finalSettingsOutput = undefined; // 繰り返し設定が無効
        }
    } else {
        finalSettingsOutput = undefined;
    }
    onSave(finalSettingsOutput);
  }, [activeTabIndex, settings, onSave, t, showErrorAlert]);

  const handleUnsetPress = useCallback(() => {
    setUnsetConfirmVisible(true);
  }, []);

  const handleConfirmUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
    const unsetSettings: DeadlineSettings = getDefaultInitialSettings();
    setSettings(unsetSettings);
    setActiveTabIndex(0); // 「日付・期間」タブに戻す
    onSave(undefined);
  }, [onSave, setSettings]);

  const handleCancelUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
  }, []);

  const handleCloseValidationErrorModal = useCallback(() => {
    setValidationErrorModalVisible(false);
  }, []);

  const routes: DeadlineRoute[] = useMemo(() => [
    { key: 'date', title: t('deadline_modal.tab_date') },
    { key: 'repeat', title: t('deadline_modal.tab_repeat') },
  ], [t]);

  const dateTabProps = useMemo((): SpecificDateSelectionTabProps => ({
    styles,
    selectedTaskDeadlineDate: settings.taskDeadlineDate,
    selectedTaskDeadlineTime: settings.taskDeadlineTime,
    isTaskDeadlineTimeEnabled: settings.isTaskDeadlineTimeEnabled,
    isPeriodSettingEnabled: settings.isPeriodSettingEnabled,
    selectedPeriodStartDate: settings.periodStartDate,
    selectedPeriodStartTime: settings.periodStartTime,
    updateSettings: updateSettingsCallback as any,
    showErrorAlert,
  }), [styles, settings, updateSettingsCallback, showErrorAlert]);

  const repeatTabProps = useMemo((): SpecificRepeatTabProps => ({
    styles,
    settings: {
        taskStartTime: settings.taskStartTime,
        isTaskStartTimeEnabled: settings.isTaskStartTimeEnabled,
        repeatFrequency: settings.repeatFrequency,
        repeatStartDate: settings.repeatStartDate,
        repeatDaysOfWeek: settings.repeatDaysOfWeek,
        isExcludeHolidays: settings.isExcludeHolidays,
        repeatEnds: settings.repeatEnds,
        customIntervalValue: settings.customIntervalValue,
        customIntervalUnit: settings.customIntervalUnit,
    },
    updateSettings: updateSettingsCallback as any,
    updateFullSettings,
    showErrorAlert,
  }), [
    styles,
    settings.taskStartTime,
    settings.isTaskStartTimeEnabled,
    settings.repeatFrequency,
    settings.repeatStartDate,
    settings.repeatDaysOfWeek,
    settings.isExcludeHolidays,
    settings.repeatEnds,
    settings.customIntervalValue,
    settings.customIntervalUnit,
    updateSettingsCallback,
    updateFullSettings,
    showErrorAlert,
  ]);

  const renderScene = useCallback(({ route }: SceneRendererProps & { route: DeadlineRoute }) => {
    switch (route.key) {
      case 'date':
        return <DateSelectionTab {...dateTabProps} />;
      case 'repeat':
        return <RepeatTab {...repeatTabProps} />;
      default:
        return null;
    }
  }, [dateTabProps, repeatTabProps]);

  const renderTabBar = useCallback(
    (props: TabBarProps<DeadlineRoute>) => (
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {props.navigationState.routes.map((route, i) => {
            const isActive = props.navigationState.index === i;
            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.tabItem,
                  isActive ? styles.tabItemActive : styles.tabItemInactive,
                ]}
                onPress={() => {
                  setActiveTabIndex(i);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {route.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ),
    [styles, setActiveTabIndex]
  );

  return (
    <>
      <Modal
        isVisible={visible}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={ANIMATION_TIMING}
        animationOutTiming={ANIMATION_TIMING}
        backdropTransitionInTiming={ANIMATION_TIMING}
        backdropTransitionOutTiming={ANIMATION_TIMING}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        backdropColor="#000000"
        backdropOpacity={BACKDROP_OPACITY}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        style={styles.modal}
        hideModalContentWhileAnimating
      >
        <SafeAreaView edges={['bottom']} style={styles.container}>
          <DeadlineModalHeader
            settings={settings}
            styles={styles}
            activeTabIndex={activeTabIndex}
          />
          <TabView
            navigationState={{ index: activeTabIndex, routes }}
            renderScene={renderScene}
            onIndexChange={setActiveTabIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
            style={{ flex: 1 }}
            swipeEnabled={Platform.OS !== 'web'}
            lazy
            lazyPreloadDistance={0}
          />
          <View style={[
            styles.footer,
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8
            }
          ]}>
            <TouchableOpacity style={[styles.button, { flex: 1, minWidth: 80 }]} onPress={onClose}>
              <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1, minWidth: 80 }]} onPress={handleUnsetPress}>
              <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
                {t('common.unset')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { flex: 1, minWidth: 80 }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText} numberOfLines={1} adjustsFontSizeToFit>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      <ConfirmModal
        visible={isUnsetConfirmVisible}
        message={t('deadline_modal.unset_confirm_message')}
        okText={t('common.ok')}
        onCancel={handleCancelUnset}
        onConfirm={handleConfirmUnset}
      />
      <ConfirmModal
        visible={isValidationErrorModalVisible}
        message={validationErrorMessage}
        okText={t('common.ok')}
        onConfirm={handleCloseValidationErrorModal}
        onCancel={handleCloseValidationErrorModal}
      />
    </>
  );
};
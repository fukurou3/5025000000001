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
    SpecificPeriodTabProps,
} from './types';
import { createDeadlineModalStyles } from './styles';
import { DeadlineModalHeader } from './DeadlineModalHeader';
import { DateSelectionTab } from './DateSelectionTab';
import { RepeatTab } from './RepeatTab';
import { PeriodTab } from './PeriodTab';
import { ConfirmModal } from './ConfirmModal';

interface DeadlineSettingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings?: DeadlineSettings) => void;
  initialSettings?: DeadlineSettings;
}

const defaultTime: DeadlineTime = { hour: 9, minute: 0 };
const todayString = CalendarUtils.getCalendarDateString(new Date());
const ANIMATION_TIMING = 250;
const BACKDROP_OPACITY = 0.4;

const getDefaultInitialSettings = (): DeadlineSettings => ({
  date: undefined,
  isTimeEnabled: false,
  time: defaultTime,

  taskStartTime: defaultTime,
  isTaskStartTimeEnabled: false,
  taskDuration: undefined,

  repeatFrequency: undefined,
  repeatStartDate: todayString,
  repeatDaysOfWeek: undefined,
  repeatEnds: undefined,
  isExcludeHolidays: false,

  periodStartDate: undefined,
  periodEndDate: undefined,
});


export const DeadlineSettingModal: React.FC<DeadlineSettingModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = useMemo(() => createDeadlineModalStyles(colorScheme === 'dark', subColor, fontSizeKey), [colorScheme, subColor, fontSizeKey]);
  const { t } = useTranslation();
  const layout = useWindowDimensions();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [settings, setSettings] = useState<DeadlineSettings>(
    initialSettings ? { ...getDefaultInitialSettings(), ...initialSettings } : getDefaultInitialSettings()
  );

  const [isUnsetConfirmVisible, setUnsetConfirmVisible] = useState(false);
  const [isValidationErrorModalVisible, setValidationErrorModalVisible] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');


  useEffect(() => {
    if (visible) {
      InteractionManager.runAfterInteractions(() => {
        const currentInitialSettings = initialSettings ? { ...getDefaultInitialSettings(), ...initialSettings } : getDefaultInitialSettings();
        setSettings(currentInitialSettings);

        if (currentInitialSettings.repeatFrequency) {
            setActiveTabIndex(1);
        } else if (currentInitialSettings.periodStartDate || currentInitialSettings.periodEndDate) {
            setActiveTabIndex(2);
        } else if (currentInitialSettings.date) {
            setActiveTabIndex(0);
        } else {
            setActiveTabIndex(0);
        }
      });
    }
  }, [visible, initialSettings]);

  const updateSettings = useCallback(
    <K extends keyof DeadlineSettings>(key: K, value: DeadlineSettings[K]) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    }, []
  );

  const updateFullSettings = useCallback((newSettings: Partial<DeadlineSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleSave = useCallback(() => {
    if (activeTabIndex === 0) {
        if (settings.isTimeEnabled && settings.time && !settings.date) {
            setValidationErrorMessage(t('deadline_modal.date_missing_for_time_alert_message'));
            setValidationErrorModalVisible(true);
            return;
        }
    } else if (activeTabIndex === 1 && settings.repeatFrequency) {
        if (!settings.repeatStartDate) {
            setValidationErrorMessage(t('deadline_modal.repeat_start_date_missing_alert_message'));
            setValidationErrorModalVisible(true);
            return;
        }
        if (settings.repeatEnds?.date && settings.repeatStartDate && settings.repeatStartDate > settings.repeatEnds.date) {
            setValidationErrorMessage(t('deadline_modal.repeat_start_must_be_before_end_alert_message'));
            setValidationErrorModalVisible(true);
            return;
        }
        if (settings.repeatFrequency === 'weekly' && (!settings.repeatDaysOfWeek || Object.values(settings.repeatDaysOfWeek).every(day => !day))) {
            setValidationErrorMessage(t('deadline_modal.weekly_day_missing_alert_message'));
            setValidationErrorModalVisible(true);
            return;
        }
    } else if (activeTabIndex === 2) {
      if (settings.periodStartDate && !settings.periodEndDate) {
        setValidationErrorMessage(t('deadline_modal.period_end_date_missing_alert_message'));
        setValidationErrorModalVisible(true);
        return;
      }
      if (!settings.periodStartDate && settings.periodEndDate) {
         setValidationErrorMessage(t('deadline_modal.period_start_date_missing_alert_message'));
         setValidationErrorModalVisible(true);
         return;
      }
      if (settings.periodStartDate && settings.periodEndDate && settings.periodStartDate > settings.periodEndDate) {
        setValidationErrorMessage(t('deadline_modal.period_start_must_be_before_end_alert_message'));
        setValidationErrorModalVisible(true);
        return;
      }
    }

    let finalSettingsOutput: DeadlineSettings | undefined;
    const defaultValues = getDefaultInitialSettings();

    if (activeTabIndex === 0) {
        if (settings.date) {
            finalSettingsOutput = {
                ...defaultValues,
                date: settings.date,
                time: settings.isTimeEnabled ? settings.time : undefined,
                isTimeEnabled: settings.isTimeEnabled,
            };
        } else {
            finalSettingsOutput = undefined;
        }
    } else if (activeTabIndex === 1) {
        if (settings.repeatFrequency && settings.repeatStartDate) {
            finalSettingsOutput = {
                ...defaultValues,
                repeatFrequency: settings.repeatFrequency,
                repeatStartDate: settings.repeatStartDate,
                repeatDaysOfWeek: settings.repeatDaysOfWeek,
                repeatEnds: settings.repeatEnds,
                isExcludeHolidays: settings.isExcludeHolidays,
                taskStartTime: settings.taskStartTime,
                isTaskStartTimeEnabled: settings.isTaskStartTimeEnabled,
                taskDuration: settings.taskDuration,
            };
        } else {
            finalSettingsOutput = undefined;
        }
    } else if (activeTabIndex === 2) {
        if (settings.periodStartDate && settings.periodEndDate) {
            finalSettingsOutput = {
                ...defaultValues,
                periodStartDate: settings.periodStartDate,
                periodEndDate: settings.periodEndDate,
            };
        } else {
             finalSettingsOutput = undefined;
        }
    } else {
        finalSettingsOutput = undefined;
    }

    onSave(finalSettingsOutput);

  }, [activeTabIndex, settings, onSave, t]);

  const handleUnsetPress = useCallback(() => {
    setUnsetConfirmVisible(true);
  }, []);

  const handleConfirmUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
    setSettings(getDefaultInitialSettings());
    onSave(undefined);
  }, [onSave]);

  const handleCancelUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
  }, []);

  const handleCloseValidationErrorModal = useCallback(() => {
    setValidationErrorModalVisible(false);
  }, []);

  const routes: DeadlineRoute[] = useMemo(() => [
    { key: 'date', title: t('deadline_modal.tab_date') },
    { key: 'repeat', title: t('deadline_modal.tab_repeat') },
    { key: 'period', title: t('deadline_modal.tab_period') },
  ], [t]);

  const dateTabProps = useMemo((): SpecificDateSelectionTabProps => ({
    styles,
    selectedDate: settings.date,
    selectedTime: settings.time,
    isTimeEnabled: settings.isTimeEnabled,
    updateSettings: (key, value) => {
        if (key === 'date' || key === 'time' || key === 'isTimeEnabled') {
            updateSettings(key, value as any);
        }
    },
  }), [styles, settings.date, settings.time, settings.isTimeEnabled, updateSettings]);

  const repeatTabProps = useMemo((): SpecificRepeatTabProps => ({
    styles,
    settings: {
        taskStartTime: settings.taskStartTime,
        isTaskStartTimeEnabled: settings.isTaskStartTimeEnabled,
        taskDuration: settings.taskDuration,
        repeatFrequency: settings.repeatFrequency,
        repeatStartDate: settings.repeatStartDate,
        repeatDaysOfWeek: settings.repeatDaysOfWeek,
        isExcludeHolidays: settings.isExcludeHolidays,
        repeatEnds: settings.repeatEnds,
    },
    updateSettings: (key, value) => {
        updateSettings(key as any, value as any);
    },
    updateFullSettings,
  }), [
    styles,
    settings.taskStartTime,
    settings.isTaskStartTimeEnabled,
    settings.taskDuration,
    settings.repeatFrequency,
    settings.repeatStartDate,
    settings.repeatDaysOfWeek,
    settings.isExcludeHolidays,
    settings.repeatEnds,
    updateSettings,
    updateFullSettings,
  ]);

  const periodTabProps = useMemo((): SpecificPeriodTabProps => ({
    styles,
    periodStartDate: settings.periodStartDate,
    periodEndDate: settings.periodEndDate,
    updateSettings: (key, value) => {
        if (key === 'periodStartDate' || key === 'periodEndDate') {
            updateSettings(key, value as any);
        }
    },
  }), [styles, settings.periodStartDate, settings.periodEndDate, updateSettings]);

  const renderScene = useCallback(({ route }: SceneRendererProps & { route: DeadlineRoute }) => {
    switch (route.key) {
      case 'date':
        return <DateSelectionTab {...dateTabProps} />;
      case 'repeat':
        return <RepeatTab {...repeatTabProps} />;
      case 'period':
        return <PeriodTab {...periodTabProps} />;
      default:
        return null;
    }
  }, [dateTabProps, repeatTabProps, periodTabProps]);

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
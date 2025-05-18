// app/features/add/components/DeadlineSettingModal/index.tsx

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { View, TouchableOpacity, Text, useWindowDimensions, Platform, InteractionManager } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneRendererProps, TabBarProps } from 'react-native-tab-view'; // TabBar を削除
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import type {
    DeadlineSettings,
    DeadlineTime,
    DeadlineRoute,
    SpecificDateSelectionTabProps,
    SpecificRepeatTabProps,
    SpecificPeriodTabProps
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
const ANIMATION_TIMING = 250;
const BACKDROP_OPACITY = 0.4;

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
    initialSettings || { date: undefined, isTimeEnabled: false, time: defaultTime, repeatFrequency: 'none' }
  );

  const [isUnsetConfirmVisible, setUnsetConfirmVisible] = useState(false);
  const [isValidationErrorModalVisible, setValidationErrorModalVisible] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');


  useEffect(() => {
    if (visible) {
      InteractionManager.runAfterInteractions(() => {
        setSettings(initialSettings || { date: undefined, isTimeEnabled: false, time: defaultTime, repeatFrequency: 'none' });
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
    if (activeTabIndex === 2) {
      if (!settings.periodStartDate && !settings.periodEndDate) {
        // No validation error here, proceed as header will show "not set"
      } else if (!settings.periodStartDate && settings.periodEndDate) {
        setValidationErrorMessage(t('deadline_modal.period_start_date_missing_alert_message', '開始日が未設定です。'));
        setValidationErrorModalVisible(true);
        return;
      }
    }
    
    if (activeTabIndex === 2 && settings.periodStartDate && !settings.periodEndDate) {
        onSave({ ...settings, date: settings.periodStartDate, periodEndDate: settings.periodStartDate });
    } else {
        onSave(settings);
    }
  }, [activeTabIndex, settings, onSave, t]);

  const handleUnsetPress = useCallback(() => {
    setUnsetConfirmVisible(true);
  }, []);

  const handleConfirmUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
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
        repeatFrequency: settings.repeatFrequency,
        repeatInterval: settings.repeatInterval,
        repeatDaysOfWeek: settings.repeatDaysOfWeek,
        isExcludeHolidays: settings.isExcludeHolidays,
        repeatEnds: settings.repeatEnds,
    },
    updateSettings: (key, value) => {
        updateSettings(key as any, value as any);
    },
    updateFullSettings: (newPartialSettings) => updateFullSettings(newPartialSettings),
  }), [
    styles,
    settings.repeatFrequency,
    settings.repeatInterval,
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
                onPress={() => props.jumpTo(route.key as any)}
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
    [styles, subColor, colorScheme]
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
                {t('common.unset') || '設定しない'}
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
        cancelText={t('common.cancel')}
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
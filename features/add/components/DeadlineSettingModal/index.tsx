// app/features/add/components/DeadlineSettingModal/index.tsx
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Modal, View, TouchableOpacity, Text, useWindowDimensions, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, TabBar, SceneRendererProps } from 'react-native-tab-view'; // SceneMap は不要になったので削除, TabBarProps, Route, NavigationStateも直接は不要
import { useTranslation } from 'react-i18next';
import { CalendarUtils } from 'react-native-calendars'; // LocaleConfig はこのファイルでは直接不要

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import type {
    DeadlineSettings,
    DeadlineTime,
    DeadlineRoute,
    SpecificDateSelectionTabProps, // 追加
    SpecificRepeatTabProps,    // 追加
    SpecificPeriodTabProps     // 追加
} from './types';
import { createDeadlineModalStyles } from './styles';
import { DeadlineModalHeader } from './DeadlineModalHeader';
import { DateSelectionTab } from './DateSelectionTab';
import { RepeatTab } from './RepeatTab';
import { PeriodTab } from './PeriodTab';

interface DeadlineSettingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: DeadlineSettings) => void;
  initialSettings?: DeadlineSettings;
}

// const todayString = CalendarUtils.getCalendarDateString(new Date()); // このファイルでは直接不要
const defaultTime: DeadlineTime = { hour: 9, minute: 0 };

export const DeadlineSettingModal: React.FC<DeadlineSettingModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = useMemo(() => createDeadlineModalStyles(colorScheme === 'dark', subColor, fontSizeKey), [colorScheme, subColor, fontSizeKey]);
  const { t } = useTranslation(); // i18n は直接使用していないので削除
  const layout = useWindowDimensions();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [settings, setSettings] = useState<DeadlineSettings>(
    initialSettings || { date: undefined, isTimeEnabled: false, time: defaultTime, repeatFrequency: 'none' }
  );

  useEffect(() => {
    if (visible) {
      InteractionManager.runAfterInteractions(() => {
        setSettings(initialSettings || { date: undefined, isTimeEnabled: false, time: defaultTime, repeatFrequency: 'none' });
      });
    }
  }, [visible, initialSettings]);

  const updateSettings = useCallback(<K extends keyof DeadlineSettings>(key: K, value: DeadlineSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFullSettings = useCallback((newSettings: Partial<DeadlineSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleSave = useCallback(() => {
    if (activeTabIndex === 2 && settings.periodStartDate && !settings.periodEndDate) {
        onSave({ ...settings, date: settings.periodStartDate, periodEndDate: settings.periodStartDate });
    } else {
        onSave(settings);
    }
  }, [activeTabIndex, settings, onSave]);

  const routes: DeadlineRoute[] = useMemo(() => [
    { key: 'date', title: t('deadline_modal.tab_date') },
    { key: 'repeat', title: t('deadline_modal.tab_repeat') },
    { key: 'period', title: t('deadline_modal.tab_period') },
  ], [t]);

  // --- タブ固有のPropsを作成 ---
  const dateTabProps = useMemo((): SpecificDateSelectionTabProps => ({
    styles,
    selectedDate: settings.date,
    selectedTime: settings.time,
    isTimeEnabled: settings.isTimeEnabled,
    // updateSettings の型を合わせるため、必要なキーのみを渡すように調整
    updateSettings: (key, value) => {
        if (key === 'date' || key === 'time' || key === 'isTimeEnabled') {
            updateSettings(key, value as any); // 型アサーションで対応 (より厳密な型ガードも検討可)
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
    // updateSettings の型を合わせる
    updateSettings: (key, value) => {
        // settings の Pick に含まれるキーのみを扱うようにガードするか、型アサーション
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
    // updateSettings の型を合わせる
    updateSettings: (key, value) => {
        if (key === 'periodStartDate' || key === 'periodEndDate') {
            updateSettings(key, value as any);
        }
    },
  }), [styles, settings.periodStartDate, settings.periodEndDate, updateSettings]);

  // --- カスタム renderScene ---
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
  }, [dateTabProps, repeatTabProps, periodTabProps]); // 依存配列に各タブのPropsオブジェクトを指定

  const renderTabBar = useCallback(
    (props: any) => ( // TabBarProps 型を使用することも可能
      <TabBar
        {...props}
        indicatorStyle={[styles.tabIndicator, { backgroundColor: subColor }]}
        style={styles.tabBar}
        labelStyle={styles.tabLabel as any} // TextStyle としてキャスト可能ならそれが望ましい
        activeColor={subColor}
        inactiveColor={colorScheme === 'dark' ? '#A0A0A0' : '#555555'}
        pressOpacity={0.8}
      />
    ),
    [styles.tabIndicator, styles.tabBar, styles.tabLabel, subColor, colorScheme]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        <View style={styles.container}>
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
            swipeEnabled={Platform.OS !== 'web'}
            lazy
            lazyPreloadDistance={0} // 全てのタブを事前にロードしない
          />
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
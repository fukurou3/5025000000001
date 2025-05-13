// app/features/add/components/DeadlineSettingModal/index.tsx
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Modal, View, TouchableOpacity, Text, useWindowDimensions, Platform, InteractionManager, ViewStyle, TextStyle } from 'react-native'; // InteractionManager, ViewStyle, TextStyle をインポート
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar, NavigationState, Route, TabBarProps } from 'react-native-tab-view'; // TabBarProps をインポート
import { useTranslation } from 'react-i18next';
import { LocaleConfig, CalendarUtils } from 'react-native-calendars';

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import type { DeadlineSettings, DeadlineTime, DeadlineRoute } from './types';
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

const todayString = CalendarUtils.getCalendarDateString(new Date());
const defaultTime: DeadlineTime = { hour: 9, minute: 0 };

export const DeadlineSettingModal: React.FC<DeadlineSettingModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const { fontSizeKey } = useContext(FontSizeContext);
  // createDeadlineModalStyles の結果を useMemo でメモ化
  const styles = useMemo(() => createDeadlineModalStyles(colorScheme === 'dark', subColor, fontSizeKey), [colorScheme, subColor, fontSizeKey]);
  const { t, i18n } = useTranslation();
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

  // commonTabProps の settings も渡すが、各タブの React.memo で詳細比較する
  const commonTabProps = useMemo(() => ({
    styles,
    settings,
    updateSettings,
    updateFullSettings,
  }), [styles, settings, updateSettings, updateFullSettings]);

  const renderScene = useCallback(
    SceneMap({
      date: () => <DateSelectionTab {...commonTabProps} />,
      repeat: () => <RepeatTab {...commonTabProps} />,
      period: () => <PeriodTab {...commonTabProps} />,
    }),
    [commonTabProps] // commonTabProps が変更された時のみ再生成
  );

  const renderTabBar = useCallback(
    (props: any) => ( // 型エラー回避のため any を使用
      <TabBar
        {...props}
        indicatorStyle={[styles.tabIndicator, { backgroundColor: subColor }]}
        style={styles.tabBar}
        labelStyle={styles.tabLabel as any} // 型エラー回避のため any を使用
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
            lazyPreloadDistance={0}
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
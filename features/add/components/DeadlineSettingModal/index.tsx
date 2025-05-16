// app/features/add/components/DeadlineSettingModal/index.tsx

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Modal, View, TouchableOpacity, Text, useWindowDimensions, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, TabBar, SceneRendererProps } from 'react-native-tab-view';
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
    SpecificPeriodTabProps
} from './types';
import { createDeadlineModalStyles } from './styles';
import { DeadlineModalHeader } from './DeadlineModalHeader';
import { DateSelectionTab } from './DateSelectionTab';
import { RepeatTab } from './RepeatTab';
import { PeriodTab } from './PeriodTab';
import { ConfirmModal } from './ConfirmModal'; // 追加

interface DeadlineSettingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings?: DeadlineSettings) => void; // ← 未設定用に?を追加
  initialSettings?: DeadlineSettings;
}

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
  const { t } = useTranslation();
  const layout = useWindowDimensions();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [settings, setSettings] = useState<DeadlineSettings>(
    initialSettings || { date: undefined, isTimeEnabled: false, time: defaultTime, repeatFrequency: 'none' }
  );

  // 確認モーダルの表示状態
  const [isUnsetConfirmVisible, setUnsetConfirmVisible] = useState(false);

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
    if (activeTabIndex === 2 && settings.periodStartDate && !settings.periodEndDate) {
        onSave({ ...settings, date: settings.periodStartDate, periodEndDate: settings.periodStartDate });
    } else {
        onSave(settings);
    }
  }, [activeTabIndex, settings, onSave]);

  // 「設定しない」ボタン押下時：まず確認モーダル表示
  const handleUnsetPress = useCallback(() => {
    setUnsetConfirmVisible(true);
  }, []);

  // 確認モーダルのOK時
  const handleConfirmUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
    onSave(undefined);
  }, [onSave]);

  // 確認モーダルのキャンセル時
  const handleCancelUnset = useCallback(() => {
    setUnsetConfirmVisible(false);
  }, []);

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
  }, [dateTabProps, repeatTabProps, periodTabProps]);

  const renderTabBar = useCallback(
    (props: any) => (
      <TabBar
        {...props}
        indicatorStyle={[styles.tabIndicator, { backgroundColor: subColor }]}
        style={styles.tabBar}
        labelStyle={styles.tabLabel as any}
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
          <View style={[
            styles.footer,
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8 // React Native >=0.71 なら使える。なければmarginで調整
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
        </View>
        <ConfirmModal
          visible={isUnsetConfirmVisible}
          message={t('deadline_modal.unset_confirm_message')}
          okText={t('common.ok')}
          cancelText={t('common.cancel')}
          onCancel={handleCancelUnset}
          onConfirm={handleConfirmUnset}
        />
      </SafeAreaView>
    </Modal>
  );
};

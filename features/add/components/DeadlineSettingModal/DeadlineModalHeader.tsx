// app/features/add/components/DeadlineSettingModal/DeadlineModalHeader.tsx
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DeadlineSettings, DeadlineModalStyles } from './types';

interface DeadlineModalHeaderProps {
  settings: DeadlineSettings; // settings は将来的に使う可能性を考慮し残します
  styles: DeadlineModalStyles;
  activeTabIndex: number; // activeTabIndex は将来的に使う可能性を考慮し残します
}

const DeadlineModalHeaderLogic: React.FC<DeadlineModalHeaderProps> = ({ settings, styles, activeTabIndex }) => {
  const { t } = useTranslation();

  const headerContent = useMemo(() => {
    // 常に固定のタイトルを表示します
    return (
      <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
        {t('deadline_modal.title_display_no_deadline', '期限設定')}
      </Text>
    );
  }, [t, styles.headerText]);

  return (
    <View style={styles.headerContainer}>
      {headerContent}
    </View>
  );
};

export const DeadlineModalHeader = React.memo(DeadlineModalHeaderLogic);
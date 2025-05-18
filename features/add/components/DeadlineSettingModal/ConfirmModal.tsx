// app/features/add/components/DeadlineSettingModal/ConfirmModal.tsx
import React, { useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';

type ConfirmModalProps = {
  visible: boolean;
  message: string;
  okText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export function ConfirmModal({
  visible,
  message,
  okText,
  onConfirm,
}: ConfirmModalProps) {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const baseFontSize = appFontSizes[fontSizeKey];
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000', fontSize: baseFontSize + 2 }]}>
            {t('common.notification_title')}
          </Text>
          <Text style={[styles.message, { color: isDark ? '#FFFFFF' : '#000000', fontSize: baseFontSize }]}>
            {message}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onConfirm} style={styles.okButton}>
              <Text style={[styles.okButtonText, { color: subColor, fontSize: baseFontSize }]}>
                {okText ?? t('common.ok')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  message: {
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: appFontSizes.medium * 1.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  okButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  okButtonText: {
    fontWeight: 'bold',
  },
});
import React, { useContext } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';

type ConfirmModalProps = {
  visible: boolean;
  message: string;
  okText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  message,
  okText,
  cancelText,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const fontSize = fontSizes[fontSizeKey];
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? '#333' : '#fff',
            padding: 24,
            borderRadius: 12,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: isDark ? '#fff' : '#000',
              fontSize,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            {message}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: '#888',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize,
                }}
              >
                {cancelText ?? t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: subColor,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize,
                }}
              >
                {okText ?? t('common.ok')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// /app/(tabs)/tasks/DeleteFolderModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { fontSizes } from '@/constants/fontSizes';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: 'delete_all' | 'only_folder') => void;
};

export function DeleteFolderModal({ visible, onClose, onSelect }: Props) {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
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
            padding: 20,
            borderRadius: 10,
            width: '100%',
          }}
        >
          <Text
            style={{
              color: isDark ? '#fff' : '#000',
              fontSize: fontSizes.medium,
              fontWeight: 'bold',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            {t('task_list.select_delete_mode')}
          </Text>

          <TouchableOpacity
            onPress={() => {
              onSelect('delete_all');
              onClose();
            }}
            style={{
              backgroundColor: 'red',
              borderRadius: 8,
              paddingVertical: 12,
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {t('task_list.delete_folder_and_tasks')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onSelect('only_folder');
              onClose();
            }}
            style={{
              backgroundColor: subColor,
              borderRadius: 8,
              paddingVertical: 12,
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {t('task_list.delete_folder_only')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: isDark ? '#555' : '#ccc',
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

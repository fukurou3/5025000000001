// /app/(tabs)/tasks/RenameFolderModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => void;
  initialName: string;
};

export function RenameFolderModal({
  visible,
  onClose,
  onSubmit,
  initialName,
}: Props) {
  const { colorScheme, subColor } = useAppTheme();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      onClose();
    }
  };

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
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            {t('task_list.rename_folder_title')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('task_list.rename_folder_placeholder')}
            placeholderTextColor={isDark ? '#aaa' : '#666'}
            style={{
              backgroundColor: isDark ? '#555' : '#eee',
              color: isDark ? '#fff' : '#000',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 20,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: '#888',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: subColor,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// app/features/tasks/components/TaskFolder.tsx
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DisplayableTaskItem } from '../types'; // 修正: types.ts から DisplayableTaskItem をインポート
import { TaskItem } from './TaskItem';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext, FontSizeKey } from '@/context/FontSizeContext';
import { createStyles } from '../styles';
import { fontSizes } from '@/constants/fontSizes';


export interface Props {
  folderName: string;
  tasks: DisplayableTaskItem[]; // 修正: 型を DisplayableTaskItem[] に変更
  isCollapsed: boolean;
  toggleFolder: (name: string) => void;
  onToggleTaskDone: (id: string, instanceDate?: string) => void;
  onRefreshTasks: () => void;
  isReordering: boolean;
  setDraggingFolder: (name: string | null) => void;
  draggingFolder: string | null;
  moveFolder: (folderName: string, direction: 'up' | 'down') => void;
  stopReordering: () => void;
  isSelecting: boolean;
  selectedIds: string[];
  onLongPressSelect: (type: 'task' | 'folder', id: string) => void;
  currentTab: 'incomplete' | 'completed';
}

export const TaskFolder: React.FC<Props> = ({
  folderName,
  tasks,
  isCollapsed,
  toggleFolder,
  onToggleTaskDone,
  isReordering,
  setDraggingFolder,
  draggingFolder,
  moveFolder,
  stopReordering,
  isSelecting,
  selectedIds,
  onLongPressSelect,
  currentTab,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);
  const { t } = useTranslation();
  const baseFontSize = fontSizes[fontSizeKey];

  const isFolderSelected = isSelecting && selectedIds.includes(folderName);

  const handleLongPress = () => {
    if (folderName) {
        onLongPressSelect('folder', folderName);
    }
  };

  const handlePressFolder = () => {
    if (isSelecting && folderName) {
        onLongPressSelect('folder', folderName);
    } else {
        toggleFolder(folderName);
    }
  };


  return (
    <View style={styles.folderContainer}>
      {folderName && (
        <TouchableOpacity
          onPress={handlePressFolder}
          onLongPress={handleLongPress}
          delayLongPress={200}
          style={[
            styles.folderHeader,
            isFolderSelected && styles.folderHeaderSelected,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
             {isSelecting && (
                <Ionicons
                    name={isFolderSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={subColor}
                    style={{ marginRight: 10 }}
                />
            )}
            {!isSelecting && folderName && (
                <Ionicons
                    name={isCollapsed ? "folder-outline" : "folder-open-outline"}
                    size={20}
                    color={isDark ? '#E0E0E0' : '#333333'}
                    style={styles.folderIconStyle}
                />
            )}
            <Text style={styles.folderName} numberOfLines={1}>{folderName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isReordering && draggingFolder !== folderName && folderName !== t('common.no_folder_name', 'フォルダなし') && (
              <>
                <TouchableOpacity onPress={() => moveFolder(folderName, 'up')} style={styles.reorderButton}>
                  <Ionicons name="arrow-up" size={20} color={subColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveFolder(folderName, 'down')} style={styles.reorderButton}>
                  <Ionicons name="arrow-down" size={20} color={subColor} />
                </TouchableOpacity>
              </>
            )}
             {isReordering && draggingFolder === folderName && folderName !== t('common.no_folder_name', 'フォルダなし') && (
                <TouchableOpacity onPress={stopReordering} style={styles.reorderButton}>
                  <Text style={{color: subColor}}>{t('common.done')}</Text>
                </TouchableOpacity>
            )}
            {!isReordering && (
                 <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={24}
                    color={subColor}
                />
            )}
          </View>
        </TouchableOpacity>
      )}
      {!isCollapsed && tasks.length > 0 && (
        tasks.map((task, index) => (
          <TaskItem
            key={task.keyId}
            task={task}
            onToggle={onToggleTaskDone}
            isSelecting={isSelecting}
            selectedIds={selectedIds}
            onLongPressSelect={(id) => onLongPressSelect('task',id)}
            currentTab={currentTab}
            isInsideFolder={true}
            isLastItem={index === tasks.length - 1}
          />
        ))
      )}
      {!isCollapsed && tasks.length === 0 && folderName && (
         <View style={{ paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center' }}>
             <Text style={{ color: isDark ? '#8E8E93' : '#6D6D72', fontSize: baseFontSize -1 }}>
                 {t('task_list.empty_folder', 'このフォルダーにはタスクがありません')}
             </Text>
         </View>
      )}
    </View>
  );
};
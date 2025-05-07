import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { AddTaskStyles } from '../_types';

interface ActionButtonsProps {
  onSave: () => void;
  onSaveDraft: () => void;
  saveText: string;
  draftText: string;
  styles: AddTaskStyles;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSave,
  onSaveDraft,
  saveText,
  draftText,
  styles,
}) => (
  <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.saveButton} onPress={onSave}>
      <Text style={styles.saveButtonText}>{saveText}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.draftButton} onPress={onSaveDraft}>
      <Text style={styles.saveButtonText}>{draftText}</Text>
    </TouchableOpacity>
  </View>
);

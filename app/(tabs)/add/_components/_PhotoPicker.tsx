import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes } from '@/constants/fontSizes';
import type { AddTaskStyles } from '../_types';
import { FontSizeKey } from '@/context/FontSizeContext';

interface PhotoPickerProps {
  imageUris: string[];
  onPick: () => void;
  onRemove: (uri: string) => void;
  selectText: string;
  addText: string;
  isDark: boolean;
  subColor: string;
  fontSizeKey: FontSizeKey;
  styles: AddTaskStyles;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  imageUris,
  onPick,
  onRemove,
  selectText,
  addText,
  isDark,
  subColor,
  fontSizeKey,
  styles,
}) =>
  imageUris.length === 0 ? (
    <TouchableOpacity style={styles.pickerButton} onPress={onPick}>
      <Text style={{ color: isDark ? '#fff' : '#000', fontSize: fontSizes[fontSizeKey] }}>
        {selectText}
      </Text>
    </TouchableOpacity>
  ) : (
    <View style={styles.pickerButtonWithPreview}>
      <TouchableOpacity style={styles.addMoreButton} onPress={onPick}>
        <Text style={styles.addMoreButtonText}>{addText}</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {imageUris.map(uri => (
          <View key={uri} style={styles.previewWrapper}>
            <Image source={{ uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeIcon}
              onPress={() => onRemove(uri)}
            >
              <Ionicons
                name="close-circle"
                size={fontSizes[fontSizeKey]}
                color="red"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

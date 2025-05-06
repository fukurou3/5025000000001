import React from 'react';
import {
  View,
  Text,
  TextInput,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import type { FieldProps } from '../types';

interface MemoFieldProps extends FieldProps {
  onContentSizeChange: (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => void;
  height: number;
}

export const MemoField: React.FC<MemoFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  onContentSizeChange,
  height,
  labelStyle,
  inputStyle,
}) => (
  <View>
    <Text style={labelStyle}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      multiline
      onContentSizeChange={onContentSizeChange}
      style={[inputStyle, { height }]}
    />
  </View>
);

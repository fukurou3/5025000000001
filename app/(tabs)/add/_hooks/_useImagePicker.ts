import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const useImagePicker = () => {
  const [imageUris, setImageUris] = useState<string[]>([]);

  const pickImages = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) {
      const uris = res.assets.map(a => a.uri);
      setImageUris(prev => [
        ...prev,
        ...uris.filter(u => !prev.includes(u)),
      ]);
    }
  }, []);

  const removeImage = useCallback((uri: string) => {
    setImageUris(prev => prev.filter(u => u !== uri));
  }, []);

  return { imageUris, pickImages, removeImage };
};

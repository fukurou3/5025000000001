import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export function useImagePicker() {
  const [imageUris, setImageUris] = useState<string[]>([]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImageUris((prev) => [...prev, ...newUris]);
    }
  };

  const removeImage = (uri: string) => {
    setImageUris((prev) => prev.filter((u) => u !== uri));
  };

  return {
    imageUris,
    pickImages,
    removeImage,
    setImageUris,
  };
}

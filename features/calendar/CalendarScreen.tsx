import React, { useRef } from 'react'
import { View, Pressable, Animated, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import testImage from '@/assets/images/k_AIOl40_400x400.jpg'

export default function CalendarScreen() {
  const router = useRouter()
  const scaleAnim = useRef(new Animated.Value(1)).current

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start()
  }

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/tasks') // ✅ 修正後
    })
  }

  return (
    <View style={styles.container}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.Image
          source={testImage} // ✅ 修正後
          style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
})

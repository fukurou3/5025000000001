import React, { useRef } from 'react'
import { View, Pressable, Animated, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'

export default function CalendarScreen() {
  const router = useRouter()
  const scaleAnim = useRef(new Animated.Value(1)).current

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9, // 押されたとき少し小さく
      useNativeDriver: true,
    }).start()
  }

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/(tabs)/tasks/tasks') // タスク一覧に遷移
    })
  }

  return (
    <View style={styles.container}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.Image
          source={require('../../../assets/images/k_AIOl40_400x400.jpg')} 
          style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // 垂直中央
    alignItems: 'center',     // 水平中央
    backgroundColor: '#fff',
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
})

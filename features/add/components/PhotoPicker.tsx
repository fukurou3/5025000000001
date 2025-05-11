// app/features/add/components/PhotoPicker.tsx

import React, { useState, useEffect, useMemo } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import * as MediaLibrary from 'expo-media-library'

type Photo = { id: string; uri: string }

export interface PhotoPickerProps {
  visible: boolean
  defaultSelected: string[]
  onCancel: () => void
  onDone: (uris: string[]) => void
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  visible,
  defaultSelected,
  onCancel,
  onDone,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [granted, setGranted] = useState(false)

  // 権限確認＋メディア取得（visible時のみ発火）
  useEffect(() => {
    if (!visible) return

    ;(async () => {
      setLoading(true)

      // 写真と動画のアクセスを個別にリクエスト（型回避）
      const { status, canAskAgain } = await (MediaLibrary.requestPermissionsAsync as any)({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      })

      if (status === 'granted') {
        setGranted(true)
        const result = await MediaLibrary.getAssetsAsync({
          first: 200,
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          sortBy: [MediaLibrary.SortBy.creationTime],
        })
        setPhotos(result.assets.map(a => ({ id: a.id, uri: a.uri })))
      } else {
        setGranted(false)
        if (!canAskAgain) {
          console.warn('ユーザーが「今後表示しない」を選択した可能性があります。')
        }
      }

      setLoading(false)
    })()
  }, [visible])

  // 選択状態を初期化
  useEffect(() => {
    if (visible) setSelected(defaultSelected)
  }, [visible, defaultSelected])

  const toggle = (uri: string) =>
    setSelected(prev =>
      prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri]
    )

  // 動的に列数とサムネイルサイズを計算
  const [portraitW] = useState(Dimensions.get('window').width)
  const baseSize = useMemo(() => portraitW / 3 - 8, [portraitW])
  const cellWithM = baseSize + 8
  const screenW = Dimensions.get('window').width
  const numCols = Math.max(Math.floor(screenW / cellWithM), 3)
  const thumbSize = screenW / numCols - 8

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={localStyles.container}>
        {/* ヘッダー */}
        <View style={localStyles.headerBar}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={localStyles.headerBtn}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={localStyles.headerTitle}>写真を選択</Text>
          <TouchableOpacity onPress={() => onDone(selected)}>
            <Text style={[localStyles.headerBtn, localStyles.headerDone]}>
              完了 ({selected.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* コンテンツ */}
        {loading ? (
          <ActivityIndicator style={localStyles.center} />
        ) : !granted ? (
          <View style={localStyles.center}>
            <Text>写真または動画へのアクセスが許可されていません</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={item => item.id}
            numColumns={numCols}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ margin: 4 }}
                onPress={() => toggle(item.uri)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: 4,
                  }}
                />
                {selected.includes(item.uri) && (
                  <>
                    <View style={localStyles.overlay} />
                    <View style={localStyles.checkCircle}>
                      <Text style={localStyles.checkIcon}>✓</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  )
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerBtn: { fontSize: 16, color: '#555' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerDone: { color: '#4CAF50' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
})

// app/features/add/components/PhotoPicker.tsx

import React, { useState, useEffect, useCallback } from 'react'; // useMemo は不要なら削除
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
  Alert,
  Linking,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';

type Photo = { id: string; uri: string };

export interface PhotoPickerProps {
  visible: boolean;
  defaultSelected: string[];
  onCancel: () => void;
  onDone: (uris: string[]) => void;
}

const ITEMS_PER_PAGE = 30; // 一度に読み込むアイテム数

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  visible,
  defaultSelected,
  onCancel,
  onDone,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string[]>([]); // 初期値は空配列
  const [loadingInitial, setLoadingInitial] = useState(true); // 初回ロード用
  const [loadingMore, setLoadingMore] = useState(false); // 追加ロード用
  const [granted, setGranted] = useState(false);
  const [after, setAfter] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

  // defaultSelected が変更されたら selected にも反映
  useEffect(() => {
    if (visible) { // モーダル表示時に初期選択を反映
        setSelected(defaultSelected || []);
    }
  }, [visible, defaultSelected]);


  const loadMedia = useCallback(async (loadMore = false) => {
    if (!granted) return;
    if (loadMore && !hasNextPage) return; // 追加ロードで次がない場合は何もしない
    if (loadMore && loadingMore) return; // すでに追加ロード中の場合は何もしない

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoadingInitial(true);
      setPhotos([]); // 初回ロードの場合はリセット
      setAfter(undefined); // 初回ロードの場合はカーソルリセット
      setHasNextPage(true); // 初回ロードの場合はリセット
    }

    try {
      const { assets, endCursor, hasNextPage: newHasNextPage } = await MediaLibrary.getAssetsAsync({
        first: ITEMS_PER_PAGE,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
        after: loadMore ? after : undefined, // 追加ロード時のみ after を使用
      });

      const newPhotos = assets.map(asset => ({ id: asset.id, uri: asset.uri }));
      setPhotos(prevPhotos => loadMore ? [...prevPhotos, ...newPhotos] : newPhotos);
      setAfter(endCursor);
      setHasNextPage(newHasNextPage);

    } catch (error) {
      console.error("Error fetching media:", error);
      Alert.alert("エラー", "メディアの読み込みに失敗しました。");
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoadingInitial(false);
      }
    }
  }, [granted, after, loadingMore, hasNextPage]); // 依存配列に注意

  // 権限確認と初回メディア取得
  useEffect(() => {
    if (!visible) {
        setPhotos([]); // 非表示になったら写真リストをクリア
        setGranted(false); // 権限状態もリセット
        return;
    }

    (async () => {
      setLoadingInitial(true); // 初回ロード開始

      const initialPermissions = await MediaLibrary.getPermissionsAsync(false);
      console.log('Initial MediaLibrary permissions:', JSON.stringify(initialPermissions, null, 2));

      if (initialPermissions.status === 'granted') {
        setGranted(true);
        await loadMedia(); // 初回メディアロード
      } else {
        const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync(false);
        console.log('Requested MediaLibrary permissions status:', status, 'Can ask again:', canAskAgain);

        if (status === 'granted') {
          setGranted(true);
          await loadMedia(); // 初回メディアロード
        } else {
          Alert.alert(
            '権限が必要です',
            '写真や動画にアクセスするためには許可が必要です。設定画面から許可してください。',
            [
              { text: 'キャンセル', onPress: () => { setLoadingInitial(false); onCancel(); }, style: 'cancel' },
              { text: '設定を開く', onPress: () => Linking.openSettings().finally(() => { setLoadingInitial(false); onCancel(); }) }
            ]
          );
          setGranted(false);
          setLoadingInitial(false);
        }
      }
    })();
  }, [visible, onCancel, loadMedia]); // loadMedia を依存配列に追加


  const handleSelect = (uri: string) => {
    setSelected(prev =>
      prev.includes(uri) ? prev.filter(item => item !== uri) : [...prev, uri]
    );
  };

  const handleDone = () => {
    onDone(selected);
  };

  const renderHeader = () => (
    <View style={localStyles.headerBar}>
      <TouchableOpacity onPress={() => { onCancel(); }}>
        <Text style={localStyles.headerBtn}>キャンセル</Text>
      </TouchableOpacity>
      <Text style={localStyles.headerTitle}>写真を選択</Text>
      <TouchableOpacity onPress={handleDone}>
        <Text style={[localStyles.headerBtn, localStyles.headerDone]}>完了</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={localStyles.container}>
        {renderHeader()}
        {loadingInitial && photos.length === 0 && (
          <View style={localStyles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        {!loadingInitial && !granted && (
          <View style={localStyles.center}>
            <Text>メディアへのアクセス権限がありません。</Text>
            <TouchableOpacity onPress={() => Linking.openSettings()} style={{ marginTop: 10 }}>
              <Text style={{ color: 'blue' }}>設定を開く</Text>
            </TouchableOpacity>
          </View>
        )}
        {granted && !loadingInitial && photos.length === 0 && !hasNextPage && ( // 初回ロード後、写真がない場合
           <View style={localStyles.center}>
            <Text>表示できる写真や動画がありません。</Text>
          </View>
        )}
        {granted && photos.length > 0 && (
          <FlatList
            data={photos}
            numColumns={3}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  width: Dimensions.get('window').width / 3 - 2,
                  height: Dimensions.get('window').width / 3 - 2,
                  margin: 1,
                }}
                onPress={() => handleSelect(item.uri)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    flex: 1,
                    width: undefined,
                    height: undefined,
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
            onEndReached={() => {
              if (hasNextPage && !loadingMore) { // 追加ロード中でなければ実行
                loadMedia(true); // true を渡して追加ロードであることを示す
              }
            }}
            onEndReachedThreshold={0.5} // 画面下部から50%の位置でonEndReachedをトリガー
            ListFooterComponent={renderFooter} // ローディングインジケーター
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

// スタイル定義 (既存のものをそのまま or 調整)
const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerBtn: { fontSize: 17, color: '#007AFF' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerDone: { fontWeight: '600' },
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff'
  },
  checkIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
});

export default PhotoPicker;
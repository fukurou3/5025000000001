// app/features/add/hooks/useSaveTask.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import type { Task, Draft } from '../types';
import { STORAGE_KEY, DRAFTS_KEY } from '../constants';
import type { DeadlineSettings, DeadlineTime } from '../components/DeadlineSettingModal/types';

interface SaveTaskParams {
  title: string;
  memo: string;
  // deadline?: Date; // この deadline パラメータは deadlineDetails で代替されるため、不要になる可能性
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit?: 'minutes' | 'hours' | 'days';
  customAmount?: number;
  folder: string;
  currentDraftId: string | null;
  clearForm: () => void;
  t: (key: string, options?: any) => string;
  deadlineDetails?: DeadlineSettings;
}

// Helper function to combine date and time into an ISO string or return undefined
const formatDeadlineISO = (settings?: DeadlineSettings): string | undefined => {
  if (settings?.date) {
    if (settings.isTimeEnabled && settings.time) {
      // YYYY-MM-DDTHH:mm:ss.sssZ (UTC) or YYYY-MM-DDTHH:mm:ss (local)
      // AsyncStorage に保存する際は、タイムゾーンの扱いを明確にする必要があります。
      // ここでは簡単のため、ローカル時刻としてISO文字列を生成する例を示します。
      // 必要に応じて、UTCに変換したり、タイムゾーン情報を含めたりしてください。
      const datePart = settings.date;
      const timePart = `${String(settings.time.hour).padStart(2, '0')}:${String(settings.time.minute).padStart(2, '0')}:00`;
      return `${datePart}T${timePart}`;
    }
    // 時刻指定がない場合は、日付のみ (YYYY-MM-DD)
    // もしISO日付文字列を期待するなら、これでOK。そうでなければ用途に合わせて調整。
    return settings.date;
  }
  return undefined;
};


export const useSaveTask = ({
  title,
  memo,
  // deadline, // deadlineDetails を使うのでコメントアウトまたは削除
  imageUris,
  notifyEnabled,
  customUnit,
  customAmount,
  folder,
  currentDraftId,
  clearForm,
  t,
  deadlineDetails,
}: SaveTaskParams) => {
  const router = useRouter();

  const saveTask = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const taskId = uuid.v4() as string;
    const newDeadlineValue = formatDeadlineISO(deadlineDetails) || ''; // 従来の deadline が string なので空文字をフォールバック

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      memo,
      deadline: newDeadlineValue, // 日付と時刻を組み合わせた文字列、または日付文字列
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit! : 'hours',
      customAmount: notifyEnabled ? customAmount! : 1,
      folder,
      deadlineDetails, // 時刻情報などを含む詳細設定はこちらに保持
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks: Task[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...tasks, newTask])
      );
      Toast.show({ type: 'success', text1: t('add_task.task_added_successfully', 'タスクを追加しました') }); // 翻訳キー修正の可能性
      clearForm();
      router.replace('/(tabs)/tasks');
    } catch (error) {
      console.error("Failed to save task:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_task', 'タスクの保存に失敗しました') }); // 翻訳キー修正の可能性
    }
  }, [
    title,
    memo,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    folder,
    clearForm,
    router,
    t,
    deadlineDetails,
  ]);

  const saveDraft = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const id = currentDraftId || (uuid.v4() as string);
    const draftDeadlineValue = formatDeadlineISO(deadlineDetails) || '';

    const draftTask: Draft = {
      id,
      title: title.trim(),
      memo,
      deadline: draftDeadlineValue,
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit! : 'hours',
      customAmount: notifyEnabled ? customAmount! : 1,
      folder,
      deadlineDetails,
    };
    try {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      const drafts: Draft[] = raw ? JSON.parse(raw) : [];
      const newDrafts = drafts.filter(d => d.id !== id);
      newDrafts.push(draftTask);
      await AsyncStorage.setItem(
        DRAFTS_KEY,
        JSON.stringify(newDrafts)
      );
      Toast.show({
        type: 'success',
        text1: t('add_task.draft_saved_successfully', '下書きを保存しました'), // 翻訳キー修正の可能性
      });
      clearForm();
    } catch (error) {
      console.error("Failed to save draft:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_draft', '下書きの保存に失敗しました') }); // 翻訳キー修正の可能性
    }
  }, [
    title,
    memo,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    folder,
    currentDraftId,
    clearForm,
    t,
    deadlineDetails,
  ]);

  return { saveTask, saveDraft };
};
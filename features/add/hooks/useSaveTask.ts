// app/features/add/hooks/useSaveTask.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import type { Task, Draft } from '../types';
import { STORAGE_KEY, DRAFTS_KEY } from '../constants';

interface SaveTaskParams {
  title: string;
  memo: string;
  deadline?: Date; // 期限がオプショナルであることを明示
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit?: 'minutes' | 'hours' | 'days'; // 通知が無効な場合はundefinedになる可能性
  customAmount?: number; // 通知が無効な場合はundefinedになる可能性
  folder: string;
  currentDraftId: string | null;
  clearForm: () => void;
  t: (key: string, options?: any) => string; // t関数の型をより正確に
}

export const useSaveTask = ({
  title,
  memo,
  deadline,
  imageUris,
  notifyEnabled,
  customUnit,
  customAmount,
  folder,
  currentDraftId,
  clearForm,
  t,
}: SaveTaskParams) => {
  const router = useRouter();

  const saveTask = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const newTask: Task = {
      id: uuid.v4() as string,
      title: title.trim(),
      memo,
      deadline: deadline ? deadline.toISOString() : '', // 期限が存在すればISO文字列に、なければ空文字列
      imageUris,
      notifyEnabled,
      // notifyEnabledがfalseの場合、customUnitとcustomAmountはTask型に含まれていても実際には使われない想定
      // もしTask型でこれらがオプショナルなら、以下のようにundefinedを許容する
      customUnit: notifyEnabled ? customUnit! : 'hours', // notifyEnabledがfalseならデフォルトまたは型に合わせた値
      customAmount: notifyEnabled ? customAmount! : 1, // notifyEnabledがfalseならデフォルトまたは型に合わせた値
      folder,
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks: Task[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...tasks, newTask])
      );
      Toast.show({ type: 'success', text1: t('add_task.task_added_successfully') }); // より具体的な成功メッセージ
      clearForm();
      router.replace('/(tabs)/tasks'); // (tabs) を含めたパスに修正
    } catch (error) {
      console.error("Failed to save task:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_task') });
    }
  }, [
    title,
    memo,
    deadline,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    folder,
    clearForm,
    router,
    t,
  ]);

  const saveDraft = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const id = currentDraftId || (uuid.v4() as string);
    const draftTask: Draft = { // Task型とDraft型が同じなのでDraftのエイリアスTaskを使用
      id,
      title: title.trim(),
      memo,
      deadline: deadline ? deadline.toISOString() : '', // 期限が存在すればISO文字列に、なければ空文字列
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit! : 'hours',
      customAmount: notifyEnabled ? customAmount! : 1,
      folder,
      // deadlineDetails: deadline ? currentDeadlineSettings : undefined, // これはindex.tsx側のロジックで、ここでは不要
    };
    try {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      const drafts: Draft[] = raw ? JSON.parse(raw) : [];
      const newDrafts = drafts.filter(d => d.id !== id);
      newDrafts.push(draftTask); // 既存のものを削除した後、新しいものを追加 (または更新)
      await AsyncStorage.setItem(
        DRAFTS_KEY,
        JSON.stringify(newDrafts)
      );
      Toast.show({
        type: 'success',
        text1: t('add_task.draft_saved_successfully'), // より具体的な成功メッセージ
      });
      clearForm();
    } catch (error) {
      console.error("Failed to save draft:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_draft') });
    }
  }, [
    title,
    memo,
    deadline,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    folder,
    currentDraftId,
    clearForm,
    // router, // saveDraft後の画面遷移は一旦保留
    t,
  ]);

  return { saveTask, saveDraft };
};
// app/features/add/hooks/useSaveTask.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import type { Task, Draft } from '../types';
import { STORAGE_KEY, DRAFTS_KEY } from '../constants';
import type { DeadlineSettings } from '../components/DeadlineSettingModal/types'; // ★ 追加

interface SaveTaskParams {
  title: string;
  memo: string;
  deadline?: Date;
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit?: 'minutes' | 'hours' | 'days';
  customAmount?: number;
  folder: string;
  currentDraftId: string | null;
  clearForm: () => void;
  t: (key: string, options?: any) => string;
  deadlineDetails?: DeadlineSettings; // ★ 追加
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
  deadlineDetails, // ★ 追加
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
      deadline: deadlineDetails?.date || (deadline ? deadline.toISOString() : ''), // deadlineDetailsを優先
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit! : 'hours',
      customAmount: notifyEnabled ? customAmount! : 1,
      folder,
      deadlineDetails, // ★ 追加
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks: Task[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...tasks, newTask])
      );
      Toast.show({ type: 'success', text1: t('add_task.task_added_successfully') });
      clearForm();
      router.replace('/(tabs)/tasks');
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
    deadlineDetails, // ★ 追加
  ]);

  const saveDraft = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const id = currentDraftId || (uuid.v4() as string);
    const draftTask: Draft = {
      id,
      title: title.trim(),
      memo,
      deadline: deadlineDetails?.date || (deadline ? deadline.toISOString() : ''), // deadlineDetailsを優先
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit! : 'hours',
      customAmount: notifyEnabled ? customAmount! : 1,
      folder,
      deadlineDetails, // ★ 追加
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
        text1: t('add_task.draft_saved_successfully'),
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
    t,
    deadlineDetails, // ★ 追加
  ]);

  return { saveTask, saveDraft };
};
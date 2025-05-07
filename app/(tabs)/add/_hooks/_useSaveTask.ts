import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import type { Task, Draft } from '../_types';
import { STORAGE_KEY, DRAFTS_KEY } from '../_constants';

interface SaveTaskParams {
  title: string;
  memo: string;
  deadline: Date;
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit: 'minutes' | 'hours' | 'days';
  customAmount: number;
  folder: string;
  currentDraftId: string | null;
  clearForm: () => void;
  t: (key: string) => string;
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
      title,
      memo,
      deadline: deadline.toISOString(),
      imageUris,
      notifyEnabled,
      customUnit,
      customAmount,
      folder,
    };
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const tasks: Task[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...tasks, newTask])
    );
    Toast.show({ type: 'success', text1: t('add_task.add_task_button') });
    clearForm();
    router.replace('/(tabs)/tasks/tasks');
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
    const draft: Draft = {
      id,
      title,
      memo,
      deadline: deadline.toISOString(),
      imageUris,
      notifyEnabled,
      customUnit,
      customAmount,
      folder,
    };
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts: Draft[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(
      DRAFTS_KEY,
      JSON.stringify([
        ...drafts.filter(d => d.id !== id),
        draft,
      ])
    );
    Toast.show({
      type: 'success',
      text1: t('add_task.save_draft_button'),
    });
    clearForm();
    router.replace('/(tabs)/drafts');
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
    router,
    t,
  ]);

  return { saveTask, saveDraft };
};

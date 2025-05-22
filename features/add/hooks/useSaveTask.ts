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

const dateStringToDate = (dateStr: string, time?: DeadlineTime): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (time) {
        dateObj.setHours(time.hour, time.minute, 0, 0);
    } else {
        dateObj.setHours(0, 0, 0, 0);
    }
    return dateObj;
};

const dateToLocalISOString = (dateObj: Date, includeTime: boolean = true): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    if (includeTime) {
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    return `${year}-${month}-${day}`;
};

const formatTaskDeadlineISO = (settings?: DeadlineSettings): string | undefined => {
  if (!settings) return undefined;

  if (settings.repeatFrequency && settings.repeatStartDate) {
    let firstInstanceStartDate: Date;
    let includeTimeInOutput = false;

    if (settings.isTaskStartTimeEnabled && settings.taskStartTime) {
      firstInstanceStartDate = dateStringToDate(settings.repeatStartDate, settings.taskStartTime);
      includeTimeInOutput = true;
    } else {
      firstInstanceStartDate = dateStringToDate(settings.repeatStartDate);
    }
    return dateToLocalISOString(firstInstanceStartDate, includeTimeInOutput);

  } else if (settings.endDate) {
    if (settings.isEndTimeEnabled && settings.endTime) {
      const deadlineDate = dateStringToDate(settings.endDate, settings.endTime);
      return dateToLocalISOString(deadlineDate, true);
    }
    const deadlineDate = dateStringToDate(settings.endDate);
    return dateToLocalISOString(deadlineDate, false);
  } else if (settings) { // この条件は現在の DeadlineSettings には存在しないため、削除または DateSelectionTab の設定を指すように修正が必要
    // DateSelectionTab の設定を想定する場合、settings.endDate, settings.endTime を使うべき
    // もしこれが DateSelectionTab のことを指していて、endDate が settings.date の代わりなら、上記の endDate のロジックでカバーされる
    // このエルス・イフは現状の型定義だと到達しない可能性が高い
  }

  return undefined;
};


export const useSaveTask = ({
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
}: SaveTaskParams) => {
  const router = useRouter();

  const saveTask = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const taskId = uuid.v4() as string;
    const taskDeadlineValue = formatTaskDeadlineISO(deadlineDetails) || '';

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      memo,
      deadline: taskDeadlineValue,
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit : 'hours',
      customAmount: notifyEnabled ? customAmount : 1,
      folder,
      deadlineDetails,
      completedInstanceDates: [], // 新規作成時は空の配列で初期化
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks: Task[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...tasks, newTask])
      );
      Toast.show({ type: 'success', text1: t('add_task.task_added_successfully', 'タスクを追加しました') }); //
      clearForm();
      router.replace('/(tabs)/tasks');
    } catch (error) {
      console.error("Failed to save task:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_task', 'タスクの保存に失敗しました') }); //
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
    const draftDeadlineValue = formatTaskDeadlineISO(deadlineDetails) || '';

    const draftTask: Draft = {
      id,
      title: title.trim(),
      memo,
      deadline: draftDeadlineValue,
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit : 'hours',
      customAmount: notifyEnabled ? customAmount : 1,
      folder,
      deadlineDetails,
      completedInstanceDates: deadlineDetails?.repeatFrequency ? [] : undefined, // 下書きの場合、繰り返しなら空配列、そうでなければundefined
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
        text1: t('add_task.draft_saved_successfully', '下書きを保存しました'), //
      });
      clearForm();
    } catch (error) {
      console.error("Failed to save draft:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_draft', '下書きの保存に失敗しました') }); //
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
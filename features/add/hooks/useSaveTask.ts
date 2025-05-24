// app/features/add/hooks/useSaveTask.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { Task, Draft } from '../types';
import { STORAGE_KEY, DRAFTS_KEY } from '../constants';
import type { DeadlineSettings, DeadlineTime } from '../components/DeadlineSettingModal/types';

dayjs.extend(utc);

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

const dateStringToUTCDate = (dateStr: string, time?: DeadlineTime): dayjs.Dayjs => {
    const [year, month, day] = dateStr.split('-').map(Number);
    let dateObj = dayjs.utc().year(year).month(month - 1).date(day);
    if (time) {
        dateObj = dateObj.hour(time.hour).minute(time.minute).second(0).millisecond(0);
    } else {
        dateObj = dateObj.hour(0).minute(0).second(0).millisecond(0);
    }
    return dateObj;
};

const dateToUTCISOString = (dateObj: dayjs.Dayjs, includeTime: boolean = true): string => {
    if (includeTime) {
        return dateObj.toISOString();
    }
    return dateObj.format('YYYY-MM-DD');
};

const formatTaskDeadlineISO = (settings?: DeadlineSettings): string | undefined => {
  if (!settings) return undefined;

  if (settings.repeatFrequency && settings.repeatStartDate) {
    // 繰り返し設定の場合、時刻は含めず日付のみとする
    const firstInstanceStartDate = dateStringToUTCDate(settings.repeatStartDate);
    return dateToUTCISOString(firstInstanceStartDate, false); // 時刻を含めない

  } else if (settings.taskDeadlineDate) {
    if (settings.isTaskDeadlineTimeEnabled && settings.taskDeadlineTime) {
      const deadlineDate = dateStringToUTCDate(settings.taskDeadlineDate, settings.taskDeadlineTime);
      return dateToUTCISOString(deadlineDate, true);
    }
    const deadlineDate = dateStringToUTCDate(settings.taskDeadlineDate);
    return dateToUTCISOString(deadlineDate, false);
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
    const taskDeadlineValue = formatTaskDeadlineISO(deadlineDetails);

    // 繰り返し設定の場合、deadlineDetails から時刻関連の情報を削除/調整
    let finalDeadlineDetails = deadlineDetails;
    if (finalDeadlineDetails?.repeatFrequency) {
        finalDeadlineDetails = {
            ...finalDeadlineDetails,
            // isTaskStartTimeEnabled: false, // 廃止
            // taskStartTime: undefined, // 廃止
        };
    }


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
      deadlineDetails: finalDeadlineDetails,
      completedInstanceDates: [],
      completedAt: undefined,
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks: Task[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...tasks, newTask])
      );
      Toast.show({ type: 'success', text1: t('add_task.task_added_successfully', 'タスクを追加しました') });
      clearForm();
      router.replace('/(tabs)/tasks');
    } catch (error) {
      console.error("Failed to save task:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_task', 'タスクの保存に失敗しました') });
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
    const draftDeadlineValue = formatTaskDeadlineISO(deadlineDetails);

    // 繰り返し設定の場合、deadlineDetails から時刻関連の情報を削除/調整
    let finalDeadlineDetails = deadlineDetails;
    if (finalDeadlineDetails?.repeatFrequency) {
        finalDeadlineDetails = {
            ...finalDeadlineDetails,
            // isTaskStartTimeEnabled: false, // 廃止
            // taskStartTime: undefined, // 廃止
        };
    }

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
      deadlineDetails: finalDeadlineDetails,
      completedInstanceDates: deadlineDetails?.repeatFrequency ? [] : undefined,
      completedAt: undefined,
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
        text1: t('add_task.draft_saved_successfully', '下書きを保存しました'),
      });
      clearForm();
    } catch (error) {
      console.error("Failed to save draft:", error);
      Toast.show({ type: 'error', text1: t('add_task.error_saving_draft', '下書きの保存に失敗しました') });
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
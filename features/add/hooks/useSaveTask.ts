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
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    if (time) {
        dateObj.setHours(time.hour, time.minute, 0, 0);
    } else {
        dateObj.setHours(0, 0, 0, 0); // Default to midnight if no time
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

// task.deadline に設定する値を決定する。
// 繰り返しタスクの場合は「最初のインスタンスの開始日時」。
// それ以外の場合は「終了日時（期限）」または「単一の日時」。
const formatTaskDeadlineISO = (settings?: DeadlineSettings): string | undefined => {
  if (!settings) return undefined;

  if (settings.repeatFrequency && settings.repeatStartDate) {
    // --- 繰り返しタスクの場合 ---
    // task.deadline には「最初のタスクの開始日時」を設定する
    let firstInstanceStartDate: Date;
    let includeTimeInOutput = false;

    if (settings.isTaskStartTimeEnabled && settings.taskStartTime) {
      firstInstanceStartDate = dateStringToDate(settings.repeatStartDate, settings.taskStartTime);
      includeTimeInOutput = true;
    } else {
      // taskStartTime が無効または未設定の場合、repeatStartDate の0時0分を開始とする
      firstInstanceStartDate = dateStringToDate(settings.repeatStartDate);
      // この場合、時刻は含めない日付のみの締め切りとするか、0時0分とするかは設計次第。
      // taskStartTimeEnabledがfalseなら時刻は重要でないという解釈もできる。
      // ここでは時刻を含めない日付のみのISO文字列（YYYY-MM-DD）とする。
    }
    // 実際の期限 (締め切り) は deadlineDetails.taskStartTime と deadlineDetails.taskDuration から計算されるべき。
    // task.deadline はソートや「次にアクティブになるタイミング」の基準として「開始日時」を使う。
    return dateToLocalISOString(firstInstanceStartDate, includeTimeInOutput);

  } else if (settings.endDate) {
    // --- 繰り返しなしで、終了日 (期限) が設定されている場合 ---
    if (settings.isEndTimeEnabled && settings.endTime) {
      const deadlineDate = dateStringToDate(settings.endDate, settings.endTime);
      return dateToLocalISOString(deadlineDate, true);
    }
    // 終了日のみ (時刻なし)
    const deadlineDate = dateStringToDate(settings.endDate);
    return dateToLocalISOString(deadlineDate, false); // YYYY-MM-DD
  } else if (settings.date) {
    // --- 繰り返しなし、終了日なしで、開始日 (単一日時指定) が設定されている場合 ---
    // これがタスクの主要な期限/実行日時となる
    if (settings.isTimeEnabled && settings.time) {
      const deadlineDate = dateStringToDate(settings.date, settings.time);
      return dateToLocalISOString(deadlineDate, true);
    }
    // 開始日のみ (時刻なし)
    const deadlineDate = dateStringToDate(settings.date);
    return dateToLocalISOString(deadlineDate, false); // YYYY-MM-DD
  }

  return undefined; // 上記いずれにも該当しない場合は期限なし
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
      deadline: taskDeadlineValue, // 繰り返しなら最初の開始日時、それ以外なら期限
      imageUris,
      notifyEnabled,
      customUnit: notifyEnabled ? customUnit : 'hours',
      customAmount: notifyEnabled ? customAmount : 1,
      folder,
      deadlineDetails, // 開始日時、終了日時、繰り返し、タスク期限(Duration)の全ての情報を含む
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
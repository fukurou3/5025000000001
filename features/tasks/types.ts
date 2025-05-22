// app/features/tasks/types.ts
import type { DeadlineSettings } from '@/features/add/components/DeadlineSettingModal/types';

export type Task = {
  id: string;
  title: string;
  memo?: string;
  deadline?: string; // 表示やソートの基準となる主要な日付
  folder?: string;
  done: boolean;
  completedAt?: string;
  customOrder?: number;
  priority?: number;
  deadlineDetails?: DeadlineSettings; // 繰り返しルールなど
  completedInstanceDates?: string[]; // 完了した繰り返しインスタンスの元の日付の配列 (例: "2024-05-21")
  // imageUris は app/features/add/types.ts にはありますが、tasks/types.ts にはなかったので、必要に応じて追加してください。
  // 例: imageUris?: string[];
};

export type FolderOrder = string[];

export type FolderDeleteMode = 'delete_all' | 'only_folder';

export type SelectableItem = {
  type: 'task' | 'folder';
  id: string;
};
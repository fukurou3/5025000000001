// C:\Users\fukur\task-app\app\features\tasks\types.ts
import type { DeadlineSettings } from '@/features/add/components/DeadlineSettingModal/types'; // インポートパスを確認・調整してください

export type Task = {
  id: string;
  title: string;
  memo?: string;
  deadline?: string;
  folder?: string;
  done: boolean;
  completedAt?: string;
  customOrder?: number;
  priority?: number;
  deadlineDetails?: DeadlineSettings; // 追加: 期限に関する詳細情報
};

export type FolderOrder = string[];

export type FolderDeleteMode = 'delete_all' | 'only_folder';

export type SelectableItem = {
  type: 'task' | 'folder';
  id: string;
};
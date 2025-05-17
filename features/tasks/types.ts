// C:\Users\fukur\task-app\app\features\tasks\types.ts

export type Task = {
  id: string;
  title: string;
  memo?: string;
  deadline?: string; // Made deadline optional
  folder?: string;
  done: boolean;
  completedAt?: string;
  customOrder?: number;
  priority?: number;
};

export type FolderOrder = string[];

// フォルダ削除モード
export type FolderDeleteMode = 'delete_all' | 'only_folder';

// 選択モード対象型
export type SelectableItem = {
  type: 'task' | 'folder';
  id: string; // タスクならタスクID、フォルダならフォルダ名
};
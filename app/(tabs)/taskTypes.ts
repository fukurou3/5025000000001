// app/(tabs)/taskTypes.ts

export type Task = {
  id: string;
  title: string;
  memo: string;
  deadline: string;
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit: 'minutes' | 'hours' | 'days';
  customAmount: number;
  done?: boolean;
  completedAt?: string;
};

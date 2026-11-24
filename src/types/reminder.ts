export interface Reminder {
  id: string;
  taskId: string;
  remindAt: string;
  deliveredAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface CreateReminderInput {
  taskId: string;
  remindAt: string;
}

export interface DueReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  taskPriority: string;
  remindAt: string;
}

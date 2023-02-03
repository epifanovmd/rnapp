import {NotificationOptions} from './notification.types';
import {NotificationMessage} from './NotificationItem';

interface NotificationInstance {
  showMessage: (
    message: NotificationMessage,
    options?: NotificationOptions,
  ) => string;
  hideMessage: (id?: string) => void;
}

class NotificationManager {
  private notificationInstance: NotificationInstance | null = null;

  showMessage(
    message: NotificationMessage,
    options?: NotificationOptions,
  ): string {
    if (this.notificationInstance) {
      return this.notificationInstance.showMessage(message, options);
    }

    return '';
  }

  hideMessage(id?: string) {
    if (this.notificationInstance) {
      this.notificationInstance.hideMessage(id);
    }
  }

  register(instance: NotificationInstance) {
    this.notificationInstance = instance;
  }

  unRegister() {
    this.notificationInstance = null;
  }
}

export default new NotificationManager();

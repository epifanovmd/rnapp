import {useContext} from 'react';
import {NotificationContext} from './Notification';

export const useNotification = () => useContext(NotificationContext);

import { useEffect, useState } from 'react';
import styles from './Notification.module.css';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, duration = 3000, onClose }: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`${styles.notification} ${visible ? styles.visible : ''}`}>
      <div className={styles.content}>
        <span className={styles.icon}>👑</span>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import styles from './Notification.module.css';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, duration = 3000, onClose }: NotificationProps) {
  const [visible, setVisible] = useState(true);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onCloseRef.current?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

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

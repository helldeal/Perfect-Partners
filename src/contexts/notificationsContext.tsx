import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onValue, ref, update } from "firebase/database";
import { db } from "../firebase/firebase";
import {
  AppNotification,
  NotificationCategory,
} from "../api/models/notifications";
import { useAuth } from "./authContext";

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadNotifications: AppNotification[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markItemAsRead: (
    category: NotificationCategory,
    itemId: number
  ) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    return onValue(ref(db, `notifications/${currentUser.uid}`), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<AppNotification, "id">
      > | null;
      const nextNotifications = data
        ? Object.entries(data)
            .map(([id, notification]) => ({ id, ...notification }))
            .sort((a, b) => b.createdAt - a.createdAt)
        : [];

      setNotifications(nextNotifications);
    });
  }, [currentUser]);

  const updateReadState = useCallback(
    async (notificationIds: string[]) => {
      if (!currentUser || notificationIds.length === 0) return;

      const updates = Object.fromEntries(
        notificationIds.map((id) => [
          `notifications/${currentUser.uid}/${id}/read`,
          true,
        ])
      );
      await update(ref(db), updates);
    },
    [currentUser]
  );

  const value = useMemo<NotificationsContextValue>(() => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.read
    );

    return {
      notifications,
      unreadNotifications,
      markAsRead: (notificationId) => updateReadState([notificationId]),
      markAllAsRead: () =>
        updateReadState(
          unreadNotifications.map((notification) => notification.id)
        ),
      markItemAsRead: (category, itemId) =>
        updateReadState(
          unreadNotifications
            .filter(
              (notification) =>
                notification.category === category &&
                notification.itemId === itemId
            )
            .map((notification) => notification.id)
        ),
    };
  }, [notifications, updateReadState]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications doit être utilisé dans NotificationsProvider");
  }
  return context;
};

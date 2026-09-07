export type NotificationCategory = "movies" | "games";
export type NotificationAction =
  | "added"
  | "deleted"
  | "possessed"
  | "unpossessed"
  | "new_season";

export type AppNotification = {
  id: string;
  action: NotificationAction;
  category: NotificationCategory;
  itemId: number;
  itemName: string;
  image?: string;
  actorId: string;
  actorName: string;
  actorPhoto?: string;
  createdAt: number;
  read: boolean;
};

export type NotificationEvent = Pick<
  AppNotification,
  "action" | "category" | "itemId" | "itemName" | "image"
>;

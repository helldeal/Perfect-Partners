import { Drawer } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNotification } from "../api/models/notifications";
import { useNotifications } from "../contexts/notificationsContext";

const getNotificationText = (notification: AppNotification) => {
  switch (notification.action) {
    case "added":
      return `a ajouté ${notification.itemName}`;
    case "deleted":
      return `a supprimé ${notification.itemName}`;
    case "possessed":
      return `possède maintenant ${notification.itemName}`;
    case "unpossessed":
      return `ne possède plus ${notification.itemName}`;
  }
};

const actionStyles: Record<
  AppNotification["action"],
  { label: string; className: string }
> = {
  added: {
    label: "Ajout",
    className: "bg-app-success-soft text-app-success",
  },
  deleted: {
    label: "Suppression",
    className: "bg-app-danger-soft text-app-danger",
  },
  possessed: {
    label: "Possession",
    className: "bg-app-warning-soft text-app-warning",
  },
  unpossessed: {
    label: "Retrait",
    className: "bg-app-surface-elevated text-app-muted",
  },
};

const categoryStyles: Record<
  AppNotification["category"],
  { label: string; className: string }
> = {
  movies: {
    label: "Cinéma",
    className: "bg-app-primary-soft text-app-primary",
  },
  games: {
    label: "Jeux",
    className: "bg-app-accent-soft text-app-accent",
  },
};

const getImageUrl = (notification: AppNotification) => {
  if (!notification.image) return null;
  if (notification.image.startsWith("//")) {
    return `https:${notification.image}`;
  }
  return notification.image.startsWith("/")
    ? `https://image.tmdb.org/t/p/w185${notification.image}`
    : notification.image;
};

export const NotificationMenu = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadNotifications, markAsRead, markAllAsRead } =
    useNotifications();

  const openNotification = async (notification: AppNotification) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    navigate(notification.category === "games" ? "/games" : "/movies");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative rounded-full p-2 text-app-muted transition-colors hover:bg-app-primary-soft hover:text-app-primary cursor-pointer"
        aria-label={`Notifications${
          unreadNotifications.length > 0
            ? `, ${unreadNotifications.length} non lues`
            : ""
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022 23.85 23.85 0 0 0 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadNotifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-app-primary px-1 text-[10px] font-bold text-white ring-2 ring-app-bg">
            {unreadNotifications.length > 99
              ? "99+"
              : unreadNotifications.length}
          </span>
        )}
      </button>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        slotProps={{
          paper: {
            className:
              "w-full max-w-sm bg-app-bg! text-app-text! border-l border-app-border",
          },
        }}
      >
        <div className="flex items-center justify-between border-b border-app-border bg-app-surface/70 p-4">
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-xs text-app-muted">
              {unreadNotifications.length} non lue
              {unreadNotifications.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-app-muted hover:bg-app-surface-elevated hover:text-app-text cursor-pointer"
            aria-label="Fermer les notifications"
          >
            ✕
          </button>
        </div>

        {unreadNotifications.length > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="mx-4 mt-3 self-end rounded-full bg-app-primary-soft px-3 py-1.5 text-xs font-medium text-app-primary hover:brightness-125 cursor-pointer"
          >
            Tout marquer comme lu
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-app-muted">
              <span className="mb-3 text-3xl">✓</span>
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const imageUrl = getImageUrl(notification);
                const actionStyle = actionStyles[notification.action];
                const categoryStyle = categoryStyles[notification.category];
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={`relative flex w-full gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer ${
                      notification.read
                        ? "border border-transparent hover:bg-app-surface"
                        : "border border-app-primary/20 bg-app-primary-soft/45 hover:bg-app-primary-soft/70"
                    }`}
                  >
                    {!notification.read && (
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-app-primary" />
                    )}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-16 w-11 shrink-0 rounded bg-app-surface-elevated" />
                    )}
                    <div className="min-w-0 pr-3">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${actionStyle.className}`}
                        >
                          {actionStyle.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryStyle.className}`}
                        >
                          {categoryStyle.label}
                        </span>
                      </div>
                      <p className="text-sm leading-5 text-app-text/85">
                        <span className="font-semibold text-white">
                          {notification.actorName}
                        </span>{" "}
                        {getNotificationText(notification)}
                      </p>
                      <time className="mt-1 block text-xs text-app-muted">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(notification.createdAt)}
                      </time>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
};

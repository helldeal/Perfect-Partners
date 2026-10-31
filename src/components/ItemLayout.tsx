import { AddButtonIcon } from "../assets/svgs";
import useModalStore from "../store/modalStore";
import { ItemIconButton } from "./ItemIconButton";
import { WatchProgress } from "./movies/WatchProgress";
import { useNotifications } from "../contexts/notificationsContext";
import { NotificationCategory } from "../api/models/notifications";
import { NewSeasonTag } from "./NewSeasonTag";
import { NotificationPing } from "./NotificationPing";
import { useState } from "react";
import { Skeleton } from "./Skeleton";

export const ItemLayout = ({
  name,
  image,
  progress,
  payload,
  onAdd,
  inList = false,
  showStatusBadge = false,
  itemSelected = false,
  specialTag,
}: {
  name: string;
  image: string;
  progress?: number;
  payload?: any;
  onAdd?: () => void;
  inList?: boolean;
  showStatusBadge?: boolean;
  itemSelected?: boolean;
  specialTag?: string;
}) => {
  const openModal = useModalStore((state) => state.openModal);
  const [settledImage, setSettledImage] = useState<string | null>(null);
  const imageLoading = settledImage !== image;
  const setShowContent = useModalStore((state) => state.setShowContent);
  const { unreadNotifications, markItemAsRead } = useNotifications();
  const itemId = payload && "game" in payload ? payload.game.id : payload?.id;
  const category: NotificationCategory =
    payload && "game" in payload ? "games" : "movies";
  const hasUnreadNotification = unreadNotifications.some(
    (notification) =>
      notification.category === category && notification.itemId === itemId
  );
  const isWatched = progress !== undefined && progress >= 100;

  const openModalHandler = () => {
    if (itemId !== undefined) {
      void markItemAsRead(category, itemId);
    }
    openModal(payload);
    setShowContent(true);
  };
  return (
    <div className="w-full h-full " onClick={openModalHandler}>
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {imageLoading && <Skeleton className="absolute inset-0" />}
        <img
          src={image ? `${image}` : "/placeholder.png"}
          alt={name}
          onLoad={() => setSettledImage(image)}
          onError={() => setSettledImage(image)}
          className={`absolute inset-0 h-full w-full rounded object-cover transition-opacity ${imageLoading ? "opacity-0" : "opacity-100"}`}
        />
        <div
          className={`absolute w-full h-full rounded top-0 left-0 ${
            itemSelected ? "border-2 border-app-primary" : ""
          }`}
        ></div>
        {!!progress && <WatchProgress progress={progress} />}
        {hasUnreadNotification && (
          <NotificationPing
            className="absolute left-2 top-2"
            size="medium"
            label="Nouvelle activité sur cette œuvre"
          />
        )}
        {specialTag && (
          <span className="absolute right-2 top-2 max-w-[70%]">
            {specialTag === "Nouvelle saison" ? (
              <NewSeasonTag compact />
            ) : (
              specialTag
            )}
          </span>
        )}
        {showStatusBadge && (isWatched || inList) && (
          <div className={`absolute right-2 flex flex-col items-end gap-1.5 ${specialTag ? "top-11" : "top-2"}`}>
            {isWatched && (
              <span className="flex items-center gap-1 rounded-full border border-app-success/40 bg-app-success-soft/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-app-success shadow-lg backdrop-blur-sm sm:text-xs">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path d="m5 10.5 3.1 3L15 6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Regardé
              </span>
            )}
            {!isWatched && inList && (
              <span className="flex items-center gap-1 rounded-full border border-app-primary/40 bg-app-primary-soft/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-app-primary shadow-lg backdrop-blur-sm sm:text-xs">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4.5 3h11A1.5 1.5 0 0 1 17 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-11A1.5 1.5 0 0 1 4.5 3Z" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                Dans la liste
              </span>
            )}
          </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity">
          {!inList && onAdd && (
            <div className="absolute bottom-2 right-2">
              <ItemIconButton
                type="secondary"
                title="Ajouter à la liste"
                handleClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
              >
                <AddButtonIcon />
              </ItemIconButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { AddButtonIcon } from "../assets/svgs";
import useModalStore from "../store/modalStore";
import { ItemIconButton } from "./ItemIconButton";
import { WatchProgress } from "./movies/WatchProgress";
import { useNotifications } from "../contexts/notificationsContext";
import { NotificationCategory } from "../api/models/notifications";

export const ItemLayout = ({
  name,
  image,
  progress,
  payload,
  onAdd,
  inList = false,
  itemSelected = false,
}: {
  name: string;
  image: string;
  progress?: number;
  payload?: any;
  onAdd?: () => void;
  inList?: boolean;
  itemSelected?: boolean;
}) => {
  const openModal = useModalStore((state) => state.openModal);
  const setShowContent = useModalStore((state) => state.setShowContent);
  const { unreadNotifications, markItemAsRead } = useNotifications();
  const itemId = payload && "game" in payload ? payload.game.id : payload?.id;
  const category: NotificationCategory =
    payload && "game" in payload ? "games" : "movies";
  const hasUnreadNotification = unreadNotifications.some(
    (notification) =>
      notification.category === category && notification.itemId === itemId
  );

  const openModalHandler = () => {
    if (itemId !== undefined) {
      void markItemAsRead(category, itemId);
    }
    openModal(payload);
    setShowContent(true);
  };
  return (
    <div className="w-full h-full " onClick={openModalHandler}>
      <div className="w-full h-full relative">
        <img
          src={image ? `${image}` : "/placeholder.png"}
          alt={name}
          className="w-full h-full rounded object-cover"
        />
        <div
          className={`absolute w-full h-full rounded top-0 left-0 ${
            itemSelected ? "border-2 border-app-primary" : ""
          }`}
        ></div>
        {!!progress && <WatchProgress progress={progress} />}
        {hasUnreadNotification && (
          <span
            className="absolute left-2 top-2 h-3 w-3 rounded-full bg-app-primary shadow-lg shadow-app-primary/40 ring-2 ring-app-bg"
            aria-label="Nouvelle activité sur cette œuvre"
          />
        )}
        {inList && onAdd && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="green"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M9 16.2l-3.5-3.5 1.41-1.41L9 13.38l7.09-7.09 1.41 1.41z" />
            </svg>
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

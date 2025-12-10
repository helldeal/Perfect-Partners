import { ItemLayout } from "../ItemLayout";
import { Game } from "../../api/models/games";
import { useDeleteGame } from "../../api/firebase/games";
import { GameItemModal } from "../../api/models/gameItemModal";

export const GameItem = ({
  game,
  inWishlist = true,
  onAdd,
  itemSelected = false,
}: {
  game: Game;
  inWishlist?: boolean;
  onAdd?: () => void;
  itemSelected?: boolean;
}) => {
  const deleteGameMutation = useDeleteGame();

  const handleDeleteGame = () => {
    deleteGameMutation.mutate(game.id.toString());
  };
  const modalContent: GameItemModal = {
    game: game,
    handleDelete: handleDeleteGame,
    handleAdd: onAdd,
    wishListed: inWishlist,
  };

  return (
    <div className="transform transition-transform duration-350 hover:scale-110 cursor-pointer">
      <ItemLayout
        name={game.name}
        image={game.cover ? `${game.cover.replace("cover_big", "720p")}` : ""}
        progress={0}
        payload={modalContent}
        onAdd={onAdd}
        inList={inWishlist}
        itemSelected={itemSelected}
      />
    </div>
  );
};

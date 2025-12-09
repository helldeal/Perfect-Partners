import { Game } from "./games";

export type GameItemModal = {
  game: Game;
  handleDelete: () => void;
  handleAdd?: () => void;
  wishListed: boolean;
};

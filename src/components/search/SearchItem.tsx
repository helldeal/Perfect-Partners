import React from "react";

interface SearchItemProps {
  id: number;
  image: string | null;
  title?: string;
  release_date?: string;
  overview?: string;
  itemList: { id: number }[];
  handleAddToList: (item: any) => void;
  item?: any;
}

const SearchItem: React.FC<SearchItemProps> = ({
  id,
  image,
  title,
  release_date,
  overview,
  itemList,
  handleAddToList,
  item,
}) => {
  return (
    <div className="text-center w-72 h-112 relative rounded-lg overflow-hidden transform transition-transform duration-350 hover:scale-110">
      <img
        src={image ? `https://image.tmdb.org/t/p/w780${image}` : undefined}
        alt={title}
        className="absolute bg-gray-800 flex items-center justify-center w-full h-full object-cover"
      />
      <div className="absolute w-full h-full flex flex-col p-3 justify-around bg-black text-white opacity-0 hover:opacity-90 transition-opacity">
        <h3 className="m-0 text-md font-bold">{title}</h3>
        <h3>
          {release_date
            ? new Date(release_date).toLocaleDateString()
            : "Date inconnue"}
        </h3>
        <p className="text-sm text-justify leading-snug line-clamp-4">
          {overview || "Aucune description disponible."}
        </p>
        {itemList.some((movie) => movie.id === id) ? (
          <span className="text-green-500 font-bold">Added to your list</span>
        ) : (
          <button
            className="cursor-pointer"
            onClick={() => handleAddToList(item)}
          >
            Add to List
          </button>
        )}
      </div>
      {itemList.some((movie) => movie.id === id) && (
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
    </div>
  );
};

export default SearchItem;

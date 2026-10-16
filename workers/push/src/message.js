const phrases = {
  added: "a ajouté",
  deleted: "a supprimé",
  possessed: "possède maintenant",
  unpossessed: "ne possède plus",
  new_season: "a détecté une nouvelle saison pour",
};

export const buildMessage = (notification, uid, notificationId) => {
  if (!notification || notification.read || notification.actorId === uid ||
      !Object.hasOwn(phrases, notification.action) || !["movies", "games"].includes(notification.category) ||
      typeof notification.itemName !== "string" || typeof notification.actorName !== "string") return null;
  return {
    title: "Perfect Partners",
    body: `${notification.actorName} ${phrases[notification.action]} ${notification.itemName}`.slice(0, 500),
    category: notification.category,
    notificationId,
    uid,
  };
};

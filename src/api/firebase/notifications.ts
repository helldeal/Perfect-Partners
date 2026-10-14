import { User } from "firebase/auth";
import { get, push, ref, update } from "firebase/database";
import { db } from "../../firebase/firebase";
import { NotificationEvent } from "../models/notifications";
import { PushTarget, sendActivityPush } from "../push";

export const notifyOtherUsers = async (
  actor: User | null,
  event: NotificationEvent
) => {
  if (!actor) return;

  try {
    const usersSnapshot = await get(ref(db, "users"));
    const userIds = Object.keys(usersSnapshot.val() ?? {}).filter(
      (userId) => userId !== actor.uid
    );
    const updates: Record<string, unknown> = {};
    const pushTargets: PushTarget[] = [];

    userIds.forEach((userId) => {
      const notificationRef = push(ref(db, `notifications/${userId}`));
      if (!notificationRef.key) return;
      pushTargets.push({ uid: userId, notificationId: notificationRef.key });

      updates[`notifications/${userId}/${notificationRef.key}`] = {
        ...event,
        actorId: actor.uid,
        actorName: actor.displayName || actor.email || "Un utilisateur",
        actorPhoto: actor.photoURL || null,
        createdAt: Date.now(),
        read: false,
      };
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      await sendActivityPush(pushTargets);
    }
  } catch (error) {
    // Une notification ne doit jamais faire échouer l'action principale.
    console.error("Impossible d'envoyer la notification", error);
  }
};

export const notifyAllUsersFromSystem = async (
  event: NotificationEvent,
  eventId: string
) => {
  try {
    const usersSnapshot = await get(ref(db, "users"));
    const updates: Record<string, unknown> = {};
    const pushTargets: PushTarget[] = [];

    Object.keys(usersSnapshot.val() ?? {}).forEach((userId) => {
      pushTargets.push({ uid: userId, notificationId: `system-${eventId}` });
      updates[`notifications/${userId}/system-${eventId}`] = {
        ...event,
        actorId: "system",
        actorName: "Perfect Partners",
        actorPhoto: null,
        createdAt: Date.now(),
        read: false,
      };
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      await sendActivityPush(pushTargets);
    }
  } catch (error) {
    console.error("Impossible d'envoyer la notification système", error);
  }
};

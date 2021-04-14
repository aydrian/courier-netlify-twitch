import { CourierClient } from "@trycourier/courier";
import { ApiClient } from "twitch";
import { ClientCredentialsAuthProvider } from "twitch-auth";

const courier = CourierClient();
const authProvider = new ClientCredentialsAuthProvider(
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_SECRET
);
const twitch = new ApiClient({ authProvider });

export async function sendOnline(event) {
  const data = await getStreamData(event.broadcaster_user_id);

  const { messageId } = await courier.lists.send({
    event: "TWITCH_STREAM_ONLINE",
    list: `${event.broadcaster_user_login.toLowerCase()}.stream.online`,
    data
  });
  console.log(
    `Online notification for ${event.broadcaster_user_name} sent. Message ID: ${messageId}.`
  );
}

const getStreamData = async (userId) => {
  const stream = await twitch.helix.streams.getStreamByUserId(userId);
  if (!stream) {
    console.log(`No current stream for ${userId}.`);
    return {};
  }
  const broadcaster = await stream.getUser();
  const game = await stream.getGame();

  const data = {
    stream: {
      id: stream.id,
      type: stream.type,
      startDate: stream.startDate,
      title: stream.title,
      thumbnailUrl: stream.thumbnailUrl.replace("-{width}x{height}", ""),
      viewers: stream.viewers
    },
    game: {
      id: game.id,
      name: game.name,
      boxArtUrl: game.boxArtUrl.replace("-{width}x{height}", "")
    },
    broadcaster: {
      id: broadcaster.id,
      type: broadcaster.broadcasterType,
      userType: broadcaster.type,
      name: broadcaster.name,
      displayName: broadcaster.displayName,
      description: broadcaster.description,
      profilePictureUrl: broadcaster.profilePictureUrl,
      views: broadcaster.views
    }
  };
  return data;
};

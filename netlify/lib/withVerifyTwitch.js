import crypto from "crypto";
const twitchSigningSecret = process.env.TWITCH_SIGNING_SECRET;

const withVerifyTwitch = (handler) => {
  return async (event, context) => {
    const messageId = event.headers["twitch-eventsub-message-id"];
    const timestamp = event.headers["twitch-eventsub-message-timestamp"];
    const messageSignature = event.headers["twitch-eventsub-message-signature"];
    const time = Math.floor(new Date().getTime() / 1000);

    if (Math.abs(time - timestamp) > 600) {
      // needs to be < 10 minutes
      console.log(
        `Verification Failed: timestamp > 10 minutes. Message Id: ${messageId}.`
      );
      return { statusCode: 422, body: "Ignore this request." };
    }

    if (!twitchSigningSecret) {
      console.log(`Twitch signing secret is empty.`);
      return { statusCode: 422, body: "Signature verification failed." };
    }

    const computedSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", twitchSigningSecret)
        .update(messageId + timestamp + event.body)
        .digest("hex");

    if (messageSignature !== computedSignature) {
      console.log(`Provided signature does not match computed signature.`);
      console.log(`Message ${messageId} Signature: `, messageSignature);
      console.log(
        `Message ${messageId} Computed Signature: ${computedSignature}`
      );
      return { statusCode: 422, body: "Signature verification failed." };
    }

    return handler(event, context);
  };
};

export default withVerifyTwitch;

# Courier Netlify Twitch

[![Netlify Status](https://api.netlify.com/api/v1/badges/ed50f56e-4fc2-4c98-8b66-1e5074c6f3d3/deploy-status)](https://app.netlify.com/sites/courier-netlify-twitch/deploys)

This is a simple [Netlify](https://netlify.com/) Function project that will receive [EventSub webhooks from Twitch]() and send notifications using [Courier](https://courier.com).

## Installation Options

First, sign up for a Courier Developer Account, it’s [free to sign up](https://app.courier.com/register/) and includes 10,000 notifications per month. Next, create a Twitch application that will be used to access the Twitch API. Then, choose an option below.

This starter focuses on the [`stream.online`](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#streamonline) EventSub subscription that will trigger when a user starts streaming on Twitch. You can extend this to handle any of the other [subscription types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types).

### Option one: One-click deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/aydrian/courier-netlify-twitch)

Clicking this button will create a new repo for you that looks like this one, and sets that repo up immediately for deployment on Netlify. You will be prompted for a repo name and to provide the values for the following environment variables to use with Courier and Twitch.

- Courier Auth Token (`COURIER_AUTH_TOKEN`), **required** - You can find this value in your [Courier API Keys Settings](https://app.courier.com/settings/api-keys).
- Twitch Signing Secret (`TWITCH_SIGNING_SECRET`), **required** - A string used for verifying requests from [Twitch](https://dev.twitch.tv/).
- Twitch Client ID (`TWITCH_CLIENT_ID`), **required** - Client ID needed to access the Twitch API. Get it from your [Twitch Dev Console](https://dev.twitch.tv/console).
- Twitch Client Secret (`TWITCH_CLIENT_SECRET`), **required** - Client Secret needed to access the Twitch API. Get it from your [Twitch Dev Console](https://dev.twitch.tv/console)

### Option two: Manual clone

You will need to [install the Netlify CLI](https://docs.netlify.com/cli/get-started/) and connect it to your Netlify site to run locally.

1. Clone this repo: `git clone https://github.com/aydrian/courier-netlify-twitch.git`
2. Connect to Netlify using `ntl init`
3. Add the above environment variables using `ntl env:set [env var] [value]`
4. Run the app locally using `ntl dev`
5. Make any changes and push to your repo to deploy.

## Subscribe to EventSub Events

To begin receiving EventSub events, you'll need to first create a subscription. The easiest way to do this is by using the [Twitch CLI](https://github.com/twitchdev/twitch-cli). Once you have installed it, use the `twitch configure` command to supply it with your Twitch Client ID and Secret. Once you have finished, you can run `twitch token` to fetch an an access token.

### Get User ID for Twitch Broadcaster

To create our subscription, we'll need to retrieve the user ID of broadcaster for whom we want to receive online alerts. We can do this using the Twitch CLI with the broadcaster's login ID:

```bash
twitch api get users -q login=trycourier
```

We'll use the `id` value from the [Twitch user object](https://dev.twitch.tv/docs/api/reference#get-users) returned in the data array.

### Subscribe to `stream.online` event

Now we can create our subscription using the Twitch CLI. You'll need the name of your Netlify site, the user id of the broadcaster, and your Twitch signing secret. Run the following command with the needed substitutions:

```bash
twitch api post eventsub/subscriptions -b '{
    "type": "stream.online",
    "version": "1",
    "condition": {
        "broadcaster_user_id": "BROADCASTER_ID"
    },
    "transport": {
        "method": "webhook",
        "callback": "https://NETLIFY_SITE_NAME.netlify.app/webhooks/twitch",
        "secret": "TWITCH_SIGNING_SECRET"
    }
}'
```

Twitch will not send a POST the the Netlify function each time the broadcaster starts streaming.

## Create Courier Notification

When the broadcaster goes online, Courier will send a notification mapped to the `TWITCH_STREAM_ONLINE` event to a list with the ID `{broadcaster_id}.stream.online`, e.g. `trycourier.stream.online`. You will need to [create a notification](https://app.courier.com/designer/notifications) and [map it to the event](https://help.courier.com/en/articles/4202416-how-to-create-and-map-event-triggers-for-your-notifications) and add recipients to the list.

### Notification Data

The following data object with details about the stream will be sent along with the Courier send call:

```json
{
  "stream": {
    "id": "40078987165",
    "type": "live",
    "startDate": "2021-01-05T19:54:35Z",
    "title": "Courier Live: Twitch EventSub and Courier",
    "thumbnailUrl": "https://static-cdn.jtvnw.net/previews-ttv/live_user_trycourier.jpg",
    "viewers": 0
  },
  "game": {
    "id": "417752",
    "name": "Talk Shows & Podcasts",
    "boxArtUrl": "https://static-cdn.jtvnw.net/ttv-boxart/Talk%20Shows%20&%20Podcasts.jpg"
  },
  "broadcaster": {
    "id": "493127514",
    "type": "affiliate",
    "userType": "",
    "name": "trycourier",
    "displayName": "trycourier",
    "description": "The smartest way to design \u0026 deliver notifications. Design once, deliver to any channel.",
    "profilePictureUrl": "https://static-cdn.jtvnw.net/jtv_user_pictures/454577ae-2bb1-4d2f-aeb9-64dfc7d00244-profile_image-300x300.png",
    "views": 60
  }
}
```

You can use any of these values in the creation of your notification using variables.

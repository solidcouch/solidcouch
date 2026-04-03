# Privacy Notice

Your SolidCouch data live on a [Solid Pod](#solid-pod) of your choice. We don't control them. We try to store as little data about you as possible. Thanks to Solid protocol, it is quite little.

## This is an experimental service

You're using this service at your own risk. SolidCouch developers or community infrastructure provider can not bear any responsibility (unless they state otherwise elsewhere).

Please keep in mind that SolidCouch is an experimental open-source software built by volunteers. The software or the community you're joining may change or get abandoned. Even if that happens, your data (profile, contacts, messages, ...) will stay on your Solid Pod, and you may use them again.

If you use a Solid Pod provider to host your Solid Pod, they probably have access to all your data, and they may discontinue their service. This is where your data are at risk. This is out of our control. Please choose accordingly or host your Solid Pod yourself.

Meeting strangers via hospitality exchange comes with a risk. Most people tend to be good, hospitable and kind, but predators exist. The SolidCouch developers intend to implement social reputation system in the future. Please read Terms of Service of the community you're joining. Unless we say otherwise, we probably can not offer you any support beyond the matching service itself.

Please trust your gut, stay safe, and have a backup plan. Don't hesitate to leave an uncomfortable situation and contact local law enforcement if you find yourself in any danger.

## Who is "we?"

"We" are the person, people, or organization who host the infrastructure for the community you're joining. Please find out more on the community page.

SolidCouch developers provide the software. They're not responsible for the community you're joining.

## How we handle your data

We only handle and store minimum necessary data for functioning of the community.

(lawful basis: contractual necessity)

### Your profile

We store your [WebID](#webid) (link to your profile) in a publicly accessible list of community members. This is currently a technical necessity so members can find and share data with each other. We don't store any data from your profile.

To remove your WebID from the list, you will be able to leave the community. In the meantime, please contact the community administrators.

### Your accommodation offers

If you offer accommodation to other members, we keep a location (geohash) and link to the offer in [geoindex service](https://github.com/solidcouch/geoindex). This service allows other members to find your offers on the map. We don't keep any other data about your accommodation offers.

To stay up to date, the geoindex service regularly fetches your profile to discover your accommodations. It doesn't store any of these data.

To remove the URI and location of your accommodation offer from the service, you can delete it via the app.

### Your email address and email notifications

Your email address is stored on your Solid Pod. [Email notification service](https://github.com/solidcouch/solid-email-notifications-direct) accesses this email when it needs to send you an email notification. The service does not keep this email address stored anywhere.

The notification service also needs to process content of the notification you send or receive. This may include your name, message with other person, contact request, experience, and other sensitive information. The notification service doesn't store any of these data. It sends the notification and forgets about it.

The notification service may use a third party SMTP service to send email notifications to/from you (for example [SendGrid](https://sendgrid.com), [SparkPost](https://support.sparkpost.com), [AWS SES](https://aws.amazon.com/ses/), &hellip;). Your email address and message content are shared with this third party. Please check with your community operator which SMTP service they use.

You can stop participating in this by leaving the community. To be sure, also change access to your email address on your Solid Pod.

In the future, we may provide option to host your own email notification service.

### Other data

We don't store any other data about you.

We are not able to read your messages.

Other members can read information about you directly from you Solid Pod via the community app: Your profile, contacts, accommodation offers, etc.

Please keep in mind that if you use a Solid Pod provider, they probably have a direct access to your data on their servers. Please read their privacy information and choose accordingly, or host your Pod yourself.

## Glossary

### Solid Pod

Your identity and data storage on the internet. You can host the pod yourself, or use a provider. If you choose a provider, it can probably access your data, so choose accordingly.

### WebID

WebID is a URI that represents you and links to a document about you (Solid WebID Profile). It often ends with `/profile/card#me`, but not always.

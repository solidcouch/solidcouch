# Configuration

You'll find [configurable options](#options) for the application here. We use environment variables for this purpose.

## Options

- `REACT_APP_COMMUNITY` - URI of the community
- `REACT_APP_COMMUNITY_CONTAINER` - name of folder in which to store person's data of this community
- `REACT_APP_EMAIL_NOTIFICATIONS_TYPE` - choose type of notifications service we use:
  - `simple` - use [simple-email-notifications](https://github.com/OpenHospitalityNetwork/simple-email-notifications) service (default)
  - `solid` - use [solid-email-notifications](https://github.com/OpenHospitalityNetwork/solid-email-notifications)
- `REACT_APP_EMAIL_NOTIFICATIONS_SERVICE` - server providing email notifications service of type specified in `REACT_APP_EMAIL_NOTIFICATIONS_TYPE`; provide base url without trailing slash; notifications will be disabled if left empty
- `REACT_APP_EMAIL_NOTIFICATIONS_IDENTITY` - identity of the email notifications service; app will allow this identity to read person's inbox
- [default CreateReactApp options](https://create-react-app.dev/docs/advanced-configuration)
- `BASE_URL` - this is base url for ClientID in ./public/clientid.jsonld, it's disabled in development environment by default (dynamic clientID is used), defaults to http://localhost:3000 in development, and https://sleepy.bike for build
- `REACT_APP_ENABLE_DEV_CLIENT_ID` - enable static ClientID in development environment (see also `BASE_URL` option). If you set this option, you'll only be able to sign in with Solid Pod running on localhost! (dynamic clientID will be used by default)

## Usage

_Note: You can also [specify environment variables in .env files](https://create-react-app.dev/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env)_

### Run

```bash
REACT_APP_VARIABLE1="variable" REACT_APP_VARIABLE_2="other variable" yarn start
```

### Build

```bash
REACT_APP_VARIABLE1="variable" REACT_APP_VARIABLE_2="other variable" yarn build
```

### Specify environment variables for github workflow build

You can specify github environment variables in [repository's settings](https://github.com/OpenHospitalityNetwork/sleepy.bike/settings/variables/actions). Some of github variables are named differently from the environment variables documented here

Have a look in [deployment workflow](../.github/workflows/deploy.yml) to see how our github environment variables map to our app configuration options

#### Github workflow variables

- `COMMUNITY`
- `COMMUNITY_CONTAINER`
- `EMAIL_NOTIFICATIONS_TYPE`
- `EMAIL_NOTIFICATIONS_SERVICE`
- `EMAIL_NOTIFICATIONS_IDENTITY`
- see [deployment workflow](../.github/workflows/deploy.yml) for more

## Adding a new option

New configuration options make things more flexible :+1:

[Custom configuration options](https://create-react-app.dev/docs/adding-custom-environment-variables) need to start with `REACT_APP_`.

Add the new option in [src/config/index.ts](../src/config/index.ts), and include some sensible default, so the app can still run without specifying anything

Make sure to also include the option in [deployment workflow](../.github/workflows/deploy.yml)

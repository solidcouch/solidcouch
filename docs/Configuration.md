# Configuration

You'll find [configurable options](#options) for the application here. We use environment variables for this purpose.

## Options

- `REACT_APP_COMMUNITY` - URI of the community
- `REACT_APP_COMMUNITY_CONTAINER` - name of folder in which to store person's data of this community

## Usage

### Run

```bash
REACT_APP_VARIABLE1="variable" REACT_APP_VARIABLE_2="other variable" yarn start
```

### Build

```bash
REACT_APP_VARIABLE1="variable" REACT_APP_VARIABLE_2="other variable" yarn build
```

### Specify environment variables for github workflow build

You need to specify environment variables in [repository's github settings](https://github.com/OpenHospitalityNetwork/sleepy.bike/settings/variables/actions). Some of our github variables are named differently from the environment variables documented here.

See the github variables in [deployment workflow](../.github/workflows/deploy.yml)

#### Github workflow variables

- `COMMUNITY`
- `COMMUNITY_CONTAINER`
- see [deployment workflow](../.github/workflows/deploy.yml) for more

## Adding a new option

New configuration options make things more flexible :+1:

Add the new option in [src/config/index.ts](../src/config/index.ts), and include some sensible default, so the app can still run without specifying anything

Make sure to also include the option in [deployment workflow](../.github/workflows/deploy.yml)

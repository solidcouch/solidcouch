# Sleepy.bike

a decentralized hospitality exchange community for slow travellers

We're developing based on [wireframes](https://www.figma.com/proto/Ke1XF3qG2auBchUWqWsRlE/wireframes?node-id=3%3A26&starting-point-node-id=3%3A26) and design (WIP - do you want to help? Join our [bi-weekly OpenHospitalityNetwork calls](https://pad.kanthaus.online/ohn#) and tell us)

## Developer quick start

This is a single page application written in React.

You need Node v16. You can use [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to switch to that particular version. You also need [yarn](https://classic.yarnpkg.com/en/docs/install).

1. Clone this repository on your computer

   ```bash
   git clone https://github.com/OpenHospitalityNetwork/sleepy.bike.git
   ```

1. Go to the project directory

   ```bash
   cd sleepy.bike
   ```

1. Install dependencies

   ```bash
   yarn
   ```

1. Run the app

   ```bash
   yarn start
   ```

You can also [configure the app](./docs/Configuration.md) with environment variables, e.g.:

```bash
REACT_APP_COMMUNITY="https://community.example/community#us" REACT_APP_COMMUNITY_CONTAINER="community-example" yarn start`
```

## Testing

We use [Cypress](https://www.cypress.io/app) to test the application.

To start the tests, run `yarn cy:dev`, wait a bit, and Cypress will open. Select "E2E tests" from the options, then pick your preferred browser (Electron and Chromium work, Firefox fails), and select a test suite to run.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note:** The logos, trademarks, and designs included in this repository are not covered by the MIT License.
They are the property of their respective owners and may not be used without permission.

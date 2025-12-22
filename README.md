# SolidCouch

A decentralized hospitality exchange community app built with Solid Protocol.

Please read the [SolidCouch Announcement](https://mrkvon.org/blog/announcing-solidcouch).

## Developer quick start

This is a single page application written in React.

You need node v22. You can use [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to switch to that particular version. You also need [yarn](https://classic.yarnpkg.com/en/docs/install).

1. Clone this repository on your computer

   ```bash
   git clone https://github.com/solidcouch/solidcouch.git
   ```

1. Go to the project directory

   ```bash
   cd solidcouch
   ```

1. Install dependencies

   ```bash
   yarn
   ```

1. Run the app

   ```bash
   yarn dev
   ```

You can also [configure the app](./docs/Configuration.md) with environment variables, e.g.:

```bash
VITE_COMMUNITY="https://community.example/community#us" VITE_COMMUNITY_CONTAINER="community-example" yarn dev`
```

## Testing

We use [Cypress](https://www.cypress.io/app) to test the application.

To start the tests, run `yarn cy:dev`, wait a bit, and Cypress will open. Select "E2E tests" from the options, then pick your preferred browser (Electron and Chromium work, Firefox fails), and select a test suite to run.

New tests are written with Playwright.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.

**Note:** The logos, trademarks, and designs included in this repository are not covered by the MIT License.
They are the property of their respective owners and may not be used without permission.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/emoji-key/)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://mrkvon.org/"><img src="https://avatars.githubusercontent.com/u/7449720?v=4?s=100" width="100px;" alt="mrkvon"/><br /><sub><b>mrkvon</b></sub></a><br /><a href="https://github.com/solidcouch/solidcouch/commits?author=mrkvon" title="Code">💻</a> <a href="#ideas-mrkvon" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-mrkvon" title="Design">🎨</a> <a href="#projectManagement-mrkvon" title="Project Management">📆</a> <a href="https://github.com/solidcouch/solidcouch/pulls?q=is%3Apr+reviewed-by%3Amrkvon" title="Reviewed Pull Requests">👀</a> <a href="#translation-mrkvon" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mariha"><img src="https://avatars.githubusercontent.com/u/22178949?v=4?s=100" width="100px;" alt="Maria Kozinska"/><br /><sub><b>Maria Kozinska</b></sub></a><br /><a href="#ideas-mariha" title="Ideas, Planning, & Feedback">🤔</a> <a href="#content-mariha" title="Content">🖋</a> <a href="#promotion-mariha" title="Promotion">📣</a> <a href="https://github.com/solidcouch/solidcouch/commits?author=mariha" title="Code">💻</a> <a href="https://github.com/solidcouch/solidcouch/pulls?q=is%3Apr+reviewed-by%3Amariha" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TMC89"><img src="https://avatars.githubusercontent.com/u/74301087?v=4?s=100" width="100px;" alt="Tanja"/><br /><sub><b>Tanja</b></sub></a><br /><a href="#content-TMC89" title="Content">🖋</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chagai95"><img src="https://avatars.githubusercontent.com/u/31655082?v=4?s=100" width="100px;" alt="chagai95"/><br /><sub><b>chagai95</b></sub></a><br /><a href="#ideas-chagai95" title="Ideas, Planning, & Feedback">🤔</a> <a href="#promotion-chagai95" title="Promotion">📣</a> <a href="#question-chagai95" title="Answering Questions">💬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/petr-hajek"><img src="https://avatars.githubusercontent.com/u/38785076?v=4?s=100" width="100px;" alt="petr-hajek"/><br /><sub><b>petr-hajek</b></sub></a><br /><a href="https://github.com/solidcouch/solidcouch/commits?author=petr-hajek" title="Code">💻</a> <a href="https://github.com/solidcouch/solidcouch/issues?q=author%3Apetr-hajek" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TilmanJimenez"><img src="https://avatars.githubusercontent.com/u/16045813?v=4?s=100" width="100px;" alt="TilmanJimenez"/><br /><sub><b>TilmanJimenez</b></sub></a><br /><a href="#design-TilmanJimenez" title="Design">🎨</a> <a href="#ideas-TilmanJimenez" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://noeldemartin.com/"><img src="https://avatars.githubusercontent.com/u/1517677?v=4?s=100" width="100px;" alt="Noel De Martin"/><br /><sub><b>Noel De Martin</b></sub></a><br /><a href="https://github.com/solidcouch/solidcouch/issues?q=author%3ANoelDeMartin" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dreirund"><img src="https://avatars.githubusercontent.com/u/1590519?v=4?s=100" width="100px;" alt="dreirund"/><br /><sub><b>dreirund</b></sub></a><br /><a href="https://github.com/solidcouch/solidcouch/issues?q=author%3Adreirund" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thhck"><img src="https://avatars.githubusercontent.com/u/133600193?v=4?s=100" width="100px;" alt="Th"/><br /><sub><b>Th</b></sub></a><br /><a href="https://github.com/solidcouch/solidcouch/issues?q=author%3Athhck" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

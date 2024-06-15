/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: [
    {
      name: "master",
      channel: "beta"
    }
  ],
  plugins: [
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ]
};
# dependabot-fail-task

Dependabot Fail Task for Azure Pipelines will fail a pipeline if any Dependabot alerts are detected on the repository.

```yml
- task: DependabotFailTask@1
  displayName: Check Dependabot 🤖
  inputs:
    auditMode: false
    failOnError: true
    failSeverity: 'low'
    githubServiceConnection: 'DependabotConnection-OAuth'
```

## Options

| Input Name              | Type    | Default    | Description                                                                                                                                     |
|-------------------------|---------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| auditMode               | boolean | `false`    | Causes the task to return a warning when alerts are detected instead of failing the pipeline. Useful for testing the task before enabling it.   |
| enterpriseServerUrl     | string  | `null`     | If you use GitHub Enterprise Server then you can specify your API base URL here. If you use Enterprise cloud, ignore this setting.              |
| failOnError             | boolean | `true`     | Causes the task to fail on any error, for example if GitHub API fails or any similar issue.                                                     |
| failSeverity            | string  | `critical` | Fails pipeline when alerts are detect at or above this severity level.                                                                          |
| gitHubServiceConnection | string  | `null`     | Used to connect to GitHub API for Dependabot data. Must have correct permissions! (See *)                                                       |
| githubToken             | string  | `null`     | GitHub token used for connecting to GitHub API, please use a secure variable if you're using this option! Must have correct permissions (see *) |

If you do not wish to specify the GitHub Token via either of the two above methods then you can also specify the environment variable: `GITHUB_TOKEN`
which will be picked up if either of the first two options are not found.

* - Please see docs/generate-token.md for more information on generating a token for use.

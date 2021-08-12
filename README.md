# GIT-QUERY
### A simple way to check runner status and invoke jobs in GIT instances

GIT Query helps in checking runners for its status and active job. This is so because there is no queue displayed for the runners in GIT similar to Jenkins and becomes an easy means to check runner status while in development. It is also aimed at running jobs during development from the IDE itself rather than go through an entire merge request process.

## Installation

Just click the install button next to the icon; ensure the **settings** are updated for the below configuration.

```json
{
    "gitQuery.host": "https://change.me/",
    "gitQuery.token": "XXXXXXXXXXXXXXXXXXXXX"
}
```

## Usage

#### Command: Runner
- Open the command pallet by pressing `ctrl + p` and type in `> Git-Query: Runner`
- This command will query GIT for available runners and present the list as
`All Jobs` or `Runner Descriptions`. Selecting the relavent operation queries all the projects and produces the result in the output window.
- In case of large number of projects the progress is displayed on the bottom status bar. Once the query is complete the output window will present with the results.
- Click the link in the output to access the job log.

#### Command: Add
[TBD]

## Known Issues

There are no known/open issues at this time.

## Release Notes

See CHANGELOG.md for a list of changes across releases.

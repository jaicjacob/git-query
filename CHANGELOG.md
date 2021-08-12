# Change Log

All notable changes to the "git-query" extension will be documented in this file.

## [Unreleased]
- Invoke runner operation for individual files to help during development
- Generate CI status of a SCM for review
- Reduce query time by smart analysis of repositories with the YML data

## [0.0.1] - 2021/06/30

### Added
- Initial release with command git-query.runner
- command git-query.runner to check for available runners and its status for the GIT instance
- Includes feature to list all jobs in either pending, created or running state

## [0.0.2] - 2021/07/30

### Bugfix
- Fixed an issue with the job status being displayed irrespective of a runner being assigned.

## [0.0.3] - 2021/08/12

### Bugfix
- Fixed compatibility of paths for Mac OS.
- Added an option to see GIT connection failure error code.

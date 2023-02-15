// BOF
// ------------------------------------
const packageName = '@@NPM_PACKAGE_NAME@@'
const packageVersion = '@@NPM_PACKAGE_VERSION@@'
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
// None
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit
const semver = require('semver') // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const publishAction = require('./publish-action.js') // Publish GitHub action
// ------------------------------------
// Main
// ------------------------------------
;(async () => {
  try {
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Initialize')
    actionsCore.info(
      'package[' + packageName + ']' + ' version[' + packageVersion + ']'
    )
    // NOTE: inputs and outputs are defined in action.yml metadata file
    const argApiToken = actionsCore.getInput('apiToken')
    const envApiToken = process.env.GITHUB_TOKEN // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_env
    // Ensure we have a usable API token
    var apiToken = null
    if (argApiToken !== null && argApiToken !== '') {
      actionsCore.debug('API token input provided')
      apiToken = argApiToken
    } else if (envApiToken !== null && envApiToken !== '') {
      actionsCore.debug('Environment API token found')
      apiToken = envApiToken
    } else {
      actionsCore.setFailed('No API token found')
    }
    actionsCore.setSecret(apiToken) // ensure we do not log sensitive data
    // The version to publish
    const argVersionTag = actionsCore.getInput('versionTag')
    if (semver.valid(argVersionTag) !== null) {
      actionsCore.debug('versionTag[' + argVersionTag + ']')
    } else {
      actionsCore.setFailed('Invalid version tag [' + argVersionTag + ']')
    }
    // Type of publishing to execute
    const argPublishType = actionsCore.getInput('publishType')
    if (argPublishType !== null && argPublishType !== '') {
      actionsCore.debug('publishType[' + argPublishType + ']')
    } else {
      actionsCore.setFailed('No publish type specified')
    }

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Publish ' + argPublishType)
    if (argPublishType === 'action') {
      // Publish GitHub action
      let actionDetails = packageName + '@' + packageVersion
      let publishActionData = await publishAction(
        apiToken,
        argVersionTag,
        actionDetails,
        [
          'README.md',
          'action.yml',
          'node/package-lock.json',
          'node/dist/index.js',
          'node/dist/licenses.txt',
        ]
      )
      if (publishActionData === undefined) {
        return
      }
      actionsCore.info('returnData[' + JSON.stringify(publishActionData) + ']')
    } else {
      actionsCore.setFailed('Invalid publish type [' + argPublishType + ']')
    }
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
  } catch (error) {
    // Should any error occur, the action will fail and the workflow will stop
    // Using the actions toolkit (core) package to log a message and set exit code
    actionsCore.setFailed(error.message)
  }
})()
// EOF

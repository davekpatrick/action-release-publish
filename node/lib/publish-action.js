// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
// None
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit core
const github = require('@actions/github') // Microsoft's actions github toolkit
// ------------------------------------
// Internal modules
// ------------------------------------
const getFileContent = require('./get-file-content.js') // Internal utilities
// ------------------------------------
// ------------------------------------
module.exports = async function publishAction(
  argApiToken,
  argActionDetails,
  argVersionTag,
  argFileList
) {
  const functionName = publishAction.name
  actionsCore.debug('Start ' + functionName)
  //
  const context = github.context
  const octokit = github.getOctokit(argApiToken)
  // Get the current reference data
  // doc: https://octokit.github.io/rest.js/v19#git-get-ref
  let getRef = context.ref.replace(/^refs\//i, '') // remove the 'refs/' prefix
  actionsCore.info('ref[' + getRef + ']')
  let getRefData = await octokit.rest.git.getRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: getRef,
  })
  actionsCore.info('returnData[' + JSON.stringify(getRefData) + ']')
  if (getRefData.status !== 200) {
    actionsCore.setFailed('Unable to retrieve ref[' + getRef + '] data')
  }
  // retrieve the current commit data
  var getCommitData = await octokit.rest.git.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    commit_sha: getRefData.data.object.sha,
  })
  actionsCore.info('returnData[' + JSON.stringify(getCommitData) + ']')
  if (getCommitData.status !== 200) {
    actionsCore.setFailed(
      'Unable to retrieve commit[' + getRefData.data.object.sha + '] data'
    )
  }
  // create blob data
  var gitBlobData = []
  for (let i = 0; i < argFileList.length; i++) {
    actionsCore.info('createBlobFile[' + argFileList[i] + ']')
    let pathToFile = argFileList[i]
    let blobData = await getFileContent(pathToFile)
    let createBlobData = await octokit.rest.git.createBlob({
      owner: context.repo.owner,
      repo: context.repo.repo,
      content: blobData,
      encoding: 'utf-8',
    })
    actionsCore.info('createBlobSha[' + createBlobData.data.sha + ']')
    // add blob data to array
    gitBlobData.push({
      filePath: argFileList[i],
      blobUrl: createBlobData.data.url,
      blobSha: createBlobData.data.sha,
    })
  }
  actionsCore.info('gitBlobData[' + JSON.stringify(gitBlobData) + ']')
  // build the tree array
  let treeArray = []
  for (let i = 0; i < gitBlobData.length; i++) {
    treeArray.push({
      path: gitBlobData[i].filePath,
      mode: '100644',
      type: 'blob',
      sha: gitBlobData[i].blobSha,
    })
  }
  actionsCore.info('treeArray[' + JSON.stringify(treeArray) + ']')
  // create tree
  let createTreeData = await octokit.rest.git.createTree({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tree: treeArray,
  })
  actionsCore.info('createTreeData[' + JSON.stringify(createTreeData) + ']')
  // create commit
  var createCommitData = await octokit.rest.git.createCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    message:
      'GitHub Action[' + argActionDetails + '] version[' + argVersionTag + ']',
    parents: [getCommitData.data.sha],
    tree: createTreeData.data.sha,
  })
  actionsCore.info(
    'createCommitData[' + JSON.stringify(createCommitData) + ']'
  )
  actionsCore.info('commit[' + createCommitData.data.sha + ']')

  // update ref
  // doc: https://octokit.github.io/rest.js/v19#git-update-ref
  // note: the 'ref' parameter must NOT have the 'refs/' prefix even though the documentation says it should
  let updateRef = 'tags/' + argVersionTag
  actionsCore.info('updateRef[' + updateRef + ']')
  var updateRefData = await octokit.rest.git.updateRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: updateRef,
    sha: createCommitData.data.sha,
    force: true,
  })
  actionsCore.info('updateRefData[' + JSON.stringify(updateRefData) + ']')
  // setup return data
  var returnData = {
    treeSha: createTreeData.data.sha,
    treeUrl: createTreeData.data.url,
    commitSha: createCommitData.data.sha,
    commitUrl: createCommitData.data.url,
    ref: updateRefData.data.ref,
    refSha: updateRefData.data.object.sha,
    refUrl: updateRefData.data.object.url,
  }
  // ------------------------------------
  actionsCore.debug('End ' + functionName)
  return returnData
  // ------------------------------------
}
// EOF

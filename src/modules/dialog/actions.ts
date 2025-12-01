import {createAction} from '@reduxjs/toolkit'

export const DIALOG_ACTIONS = {
  showFolderCreate: createAction(
    'dialog/showFolderCreate',
    function prepare({parentId}: {parentId?: string} = {}) {
      return {
        payload: {parentId}
      }
    }
  ),
  showFolderEdit: createAction(
    'dialog/showFolderEdit',
    function prepare({folderId}: {folderId: string}) {
      return {
        payload: {folderId}
      }
    }
  ),
  showFolderMove: createAction(
    'dialog/showFolderMove',
    function prepare({folderId}: {folderId: string}) {
      return {
        payload: {folderId}
      }
    }
  ),
  showAssetMoveToFolder: createAction(
    'dialog/showAssetMoveToFolder',
    function prepare({assetIds}: {assetIds: string[]}) {
      return {
        payload: {assetIds}
      }
    }
  ),
  showTagCreate: createAction('dialog/showTagCreate'),
  showTagEdit: createAction('dialog/showTagEdit', function prepare({tagId}: {tagId: string}) {
    return {
      payload: {tagId}
    }
  })
}

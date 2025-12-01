import {createSlice, type PayloadAction} from '@reduxjs/toolkit'
import pluralize from 'pluralize'
import {ofType} from 'redux-observable'
import {EMPTY, from, of} from 'rxjs'
import {filter, mergeMap} from 'rxjs/operators'
import type {AssetItem, Dialog, Folder, MyEpic, Tag} from '../../types'
import {assetsActions} from '../assets'
import {ASSETS_ACTIONS} from '../assets/actions'
import {foldersActions} from '../folders'
import {tagsActions} from '../tags'
import {DIALOG_ACTIONS} from './actions'

type DialogReducerState = {
  items: Dialog[]
}

const initialState = {
  items: []
} as DialogReducerState

const dialogSlice = createSlice({
  name: 'dialog',
  initialState,
  extraReducers: builder => {
    builder
      .addCase(DIALOG_ACTIONS.showFolderCreate, (state, action) => {
        const {parentId} = action.payload
        state.items.push({
          id: 'folderCreate',
          parentId,
          type: 'folderCreate'
        })
      })
      .addCase(DIALOG_ACTIONS.showFolderEdit, (state, action) => {
        const {folderId} = action.payload
        state.items.push({
          folderId,
          id: folderId,
          type: 'folderEdit'
        })
      })
      .addCase(DIALOG_ACTIONS.showFolderMove, (state, action) => {
        const {folderId} = action.payload
        state.items.push({
          folderId,
          id: 'folderMoveToFolder',
          type: 'folderMoveToFolder'
        })
      })
      .addCase(DIALOG_ACTIONS.showAssetMoveToFolder, (state, action) => {
        const {assetIds} = action.payload
        state.items.push({
          assetIds,
          id: 'assetMoveToFolder',
          type: 'assetMoveToFolder'
        })
      })
      .addCase(DIALOG_ACTIONS.showTagCreate, state => {
        state.items.push({
          id: 'tagCreate',
          type: 'tagCreate'
        })
      })
      .addCase(DIALOG_ACTIONS.showTagEdit, (state, action) => {
        const {tagId} = action.payload
        state.items.push({
          id: tagId,
          tagId,
          type: 'tagEdit'
        })
      })
  },
  reducers: {
    // Clear all dialogs
    clear(state) {
      state.items = []
    },
    // Add newly created inline tag to assetEdit dialog
    inlineTagCreate(state, action: PayloadAction<{assetId: string; tag: Tag}>) {
      const {assetId, tag} = action.payload

      state.items.forEach(item => {
        if (item.type === 'assetEdit' && item.assetId === assetId) {
          item.lastCreatedTag = {
            label: tag.name.current,
            value: tag._id
          }
        }
      })
    },
    // Remove inline tags from assetEdit dialog
    inlineTagRemove(state, action: PayloadAction<{tagIds: string[]}>) {
      const {tagIds} = action.payload

      state.items.forEach(item => {
        if (item.type === 'assetEdit') {
          item.lastRemovedTagIds = tagIds
        }
      })
    },
    // Remove dialog by id
    remove(state, action: PayloadAction<{id: string}>) {
      const id = action.payload?.id
      state.items = state.items.filter(item => item.id !== id)
    },
    showConfirmAssetsTagAdd(
      state,
      action: PayloadAction<{
        assetsPicked: AssetItem[]
        closeDialogId?: string
        tag: Tag
      }>
    ) {
      const {assetsPicked, closeDialogId, tag} = action.payload

      const suffix = `${assetsPicked.length} ${pluralize('asset', assetsPicked.length)}`

      state.items.push({
        closeDialogId,
        confirmCallbackAction: ASSETS_ACTIONS.tagsAddRequest({
          assets: assetsPicked,
          tag
        }),
        confirmText: `Yes, add tag to ${suffix}`,
        title: `Add tag ${tag.name.current} to ${suffix}?`,
        id: 'confirm',
        headerTitle: 'Confirm tag addition',
        tone: 'primary',
        type: 'confirm'
      })
    },
    showConfirmAssetsTagRemove(
      state,
      action: PayloadAction<{
        assetsPicked: AssetItem[]
        closeDialogId?: string
        tag: Tag
      }>
    ) {
      const {assetsPicked, closeDialogId, tag} = action.payload

      const suffix = `${assetsPicked.length} ${pluralize('asset', assetsPicked.length)}`

      state.items.push({
        closeDialogId,
        confirmCallbackAction: ASSETS_ACTIONS.tagsRemoveRequest({assets: assetsPicked, tag}),
        confirmText: `Yes, remove tag from ${suffix}`,
        headerTitle: 'Confirm tag removal',
        id: 'confirm',
        title: `Remove tag ${tag.name.current} from ${suffix}?`,
        tone: 'critical',
        type: 'confirm'
      })
    },
    showConfirmDeleteAssets(
      state,
      action: PayloadAction<{assets: AssetItem[]; closeDialogId?: string}>
    ) {
      const {assets, closeDialogId} = action.payload

      const suffix = `${assets.length} ${pluralize('asset', assets.length)}`

      state.items.push({
        closeDialogId,
        confirmCallbackAction: assetsActions.deleteRequest({
          assets: assets.map(assetItem => assetItem.asset)
        }),
        confirmText: `Yes, delete ${suffix}`,
        description: 'This operation cannot be reversed. Are you sure you want to continue?',
        title: `Permanently delete ${suffix}?`,
        id: 'confirm',
        headerTitle: 'Confirm deletion',
        tone: 'critical',
        type: 'confirm'
      })
    },
    showConfirmDeleteFolder(
      state,
      action: PayloadAction<{closeDialogId?: string; folder: Folder}>
    ) {
      const {closeDialogId, folder} = action.payload

      const suffix = 'folder'

      state.items.push({
        closeDialogId,
        confirmCallbackAction: foldersActions.deleteRequest({folder}),
        confirmText: `Yes, delete ${suffix}`,
        description: 'This operation cannot be reversed. Are you sure you want to continue?',
        title: `Permanently delete ${suffix}?`,
        id: 'confirm',
        headerTitle: 'Confirm deletion',
        tone: 'critical',
        type: 'confirm'
      })
    },
    showConfirmDeleteTag(state, action: PayloadAction<{closeDialogId?: string; tag: Tag}>) {
      const {closeDialogId, tag} = action.payload

      const suffix = 'tag'

      state.items.push({
        closeDialogId,
        confirmCallbackAction: tagsActions.deleteRequest({tag}),
        confirmText: `Yes, delete ${suffix}`,
        description: 'This operation cannot be reversed. Are you sure you want to continue?',
        title: `Permanently delete ${suffix}?`,
        id: 'confirm',
        headerTitle: 'Confirm deletion',
        tone: 'critical',
        type: 'confirm'
      })
    },
    showAssetEdit(state, action: PayloadAction<{assetId: string}>) {
      const {assetId} = action.payload
      state.items.push({
        assetId,
        id: assetId,
        type: 'assetEdit'
      })
    },
    showSearchFacets(state) {
      state.items.push({
        id: 'searchFacets',
        type: 'searchFacets'
      })
    },
    showTags(state) {
      state.items.push({
        id: 'tags',
        type: 'tags'
      })
    }
  }
})

// Epics

export const dialogClearOnAssetUpdateEpic: MyEpic = action$ =>
  action$.pipe(
    ofType(
      assetsActions.deleteComplete.type,
      assetsActions.updateComplete.type,
      foldersActions.deleteComplete.type,
      foldersActions.moveComplete.type,
      foldersActions.updateComplete.type,
      tagsActions.deleteComplete.type,
      tagsActions.updateComplete.type
    ),
    filter(
      (action: {
        payload: {closeDialogId?: string}
      }): action is PayloadAction<{closeDialogId?: string}> => !!action?.payload?.closeDialogId
    ),
    mergeMap(action => {
      const dialogId = action?.payload?.closeDialogId
      const actions = []

      if (dialogId) {
        actions.push(dialogSlice.actions.remove({id: dialogId}))
      }

      // For folder moves, also close the move dialog
      if (action.type === foldersActions.moveComplete.type) {
        actions.push(dialogSlice.actions.remove({id: 'folderMoveToFolder'}))
      }

      return from(actions)
    })
  )

export const dialogTagCreateEpic: MyEpic = action$ =>
  action$.pipe(
    filter(tagsActions.createComplete.match),
    mergeMap(action => {
      const {assetId, tag} = action?.payload

      if (assetId) {
        return of(dialogSlice.actions.inlineTagCreate({tag, assetId}))
      }

      if (tag._id) {
        return of(dialogSlice.actions.remove({id: 'tagCreate'}))
      }

      return EMPTY
    })
  )

export const dialogTagDeleteEpic: MyEpic = action$ =>
  action$.pipe(
    filter(tagsActions.listenerDeleteQueueComplete.match),
    mergeMap(action => {
      const {tagIds} = action?.payload

      return of(dialogSlice.actions.inlineTagRemove({tagIds}))
    })
  )

export const dialogActions = {...dialogSlice.actions}

export default dialogSlice.reducer

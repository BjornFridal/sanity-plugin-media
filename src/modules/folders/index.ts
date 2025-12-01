import {createSelector, createSlice, type PayloadAction} from '@reduxjs/toolkit'
import type {ClientError} from '@sanity/client'
import groq from 'groq'
import type {Selector} from 'react-redux'
import {ofType} from 'redux-observable'
import {from, of} from 'rxjs'
import {bufferTime, catchError, filter, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators'
import {FOLDER_DOCUMENT_NAME} from '../../constants'
import checkFolderName from '../../operators/checkFolderName'
import debugThrottle from '../../operators/debugThrottle'
import type {
  Folder,
  FolderItem,
  FolderSelectOption,
  FolderTreeItem,
  HttpError,
  MyEpic
} from '../../types'
import {DIALOG_ACTIONS} from '../dialog/actions'
import type {RootReducerState} from '../types'

export type FoldersReducerState = {
  allIds: string[]
  byIds: Record<string, FolderItem>
  creating: boolean
  creatingError?: HttpError
  currentFolderId: string | null | undefined // null = root, undefined = see all
  expandedFolderIds: string[] // Track which folders are expanded in tree view
  fetchCount: number
  fetching: boolean
  fetchingError?: HttpError
  panelVisible: boolean
}

const initialState = {
  allIds: [],
  byIds: {},
  creating: false,
  creatingError: undefined,
  currentFolderId: null, // Start at root
  expandedFolderIds: [], // Start with all folders collapsed
  fetchCount: -1,
  fetching: false,
  fetchingError: undefined,
  panelVisible: true
} as FoldersReducerState

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  extraReducers: builder => {
    builder
      .addCase(DIALOG_ACTIONS.showFolderCreate, state => {
        delete state.creatingError
      })
      .addCase(DIALOG_ACTIONS.showFolderEdit, (state, action) => {
        const {folderId} = action.payload
        if (folderId && state.byIds[folderId]) {
          delete state.byIds[folderId].error
        }
      })
  },
  reducers: {
    createComplete(state, action: PayloadAction<{folder: Folder}>) {
      const {folder} = action.payload
      state.creating = false
      if (folder._id && !state.allIds.includes(folder._id)) {
        state.allIds.push(folder._id)
      }
      if (folder._id) {
        state.byIds[folder._id] = {
          _type: 'folder',
          folder,
          picked: false,
          updating: false
        }
      }
    },
    createError(state, action: PayloadAction<{error: HttpError; name: string}>) {
      state.creating = false
      state.creatingError = action.payload.error
    },
    createRequest(state, _action: PayloadAction<{name: string; parentId?: string}>) {
      state.creating = true
      delete state.creatingError
    },
    deleteComplete(state, action: PayloadAction<{folderId: string}>) {
      const {folderId} = action.payload
      const deleteIndex = state.allIds.indexOf(folderId)
      if (deleteIndex >= 0) {
        state.allIds.splice(deleteIndex, 1)
      }
      delete state.byIds[folderId]

      // If we're currently in the deleted folder, navigate to its parent or root
      if (state.currentFolderId === folderId) {
        const folder = state.byIds[folderId]?.folder
        state.currentFolderId = folder?.parent?._ref || null
      }
    },
    deleteError(state, action: PayloadAction<{error: HttpError; folderId: string}>) {
      const {error, folderId} = action.payload
      if (folderId && state.byIds[folderId]) {
        state.byIds[folderId].error = error
        state.byIds[folderId].updating = false
      }
    },
    deleteRequest(state, action: PayloadAction<{folder: Folder}>) {
      const {folder} = action.payload
      const folderId = folder?._id
      if (folderId && state.byIds[folderId]) {
        state.byIds[folderId].picked = false
        state.byIds[folderId].updating = true

        Object.keys(state.byIds).forEach(key => {
          delete state.byIds[key].error
        })
      }
    },
    fetchComplete(state, action: PayloadAction<{folders: Folder[]}>) {
      const {folders} = action.payload

      folders?.forEach(folder => {
        if (folder._id) {
          state.allIds.push(folder._id)
          state.byIds[folder._id] = {
            _type: 'folder',
            folder,
            picked: false,
            updating: false
          }
        }
      })

      state.fetching = false
      state.fetchCount = folders.length || 0
      delete state.fetchingError
    },
    fetchError(state, action: PayloadAction<{error: HttpError}>) {
      const {error} = action.payload
      state.fetching = false
      state.fetchingError = error
    },
    fetchRequest: {
      reducer: (state, _action: PayloadAction<{query: string}>) => {
        state.fetching = true
        delete state.fetchingError
      },
      prepare: () => {
        // Construct query
        const query = groq`
          {
            "items": *[
              _type == "${FOLDER_DOCUMENT_NAME}"
              && !(_id in path("drafts.**"))
            ] {
              _createdAt,
              _updatedAt,
              _id,
              _rev,
              _type,
              name,
              parent
            } | order(name.current asc),
          }
        `
        return {payload: {query}}
      }
    },
    // Queue batch folder creation
    listenerCreateQueue(_state, _action: PayloadAction<{folder: Folder}>) {
      //
    },
    // Apply created folders (via sanity real-time events)
    listenerCreateQueueComplete(state, action: PayloadAction<{folders: Folder[]}>) {
      const {folders} = action.payload

      folders?.forEach(folder => {
        if (folder._id) {
          state.byIds[folder._id] = {
            _type: 'folder',
            folder,
            picked: false,
            updating: false
          }
          if (!state.allIds.includes(folder._id)) {
            state.allIds.push(folder._id)
          }
        }
      })
    },
    // Queue batch folder deletion
    listenerDeleteQueue(_state, _action: PayloadAction<{folderId: string}>) {
      //
    },
    // Apply deleted folders (via sanity real-time events)
    listenerDeleteQueueComplete(state, action: PayloadAction<{folderIds: string[]}>) {
      const {folderIds} = action.payload

      folderIds?.forEach(folderId => {
        const deleteIndex = state.allIds.indexOf(folderId)
        if (deleteIndex >= 0) {
          state.allIds.splice(deleteIndex, 1)
        }
        delete state.byIds[folderId]

        // Navigate to root if current folder was deleted
        if (state.currentFolderId === folderId) {
          state.currentFolderId = null
        }
      })
    },
    // Queue batch folder updates
    listenerUpdateQueue(_state, _action: PayloadAction<{folder: Folder}>) {
      //
    },
    // Apply updated folders (via sanity real-time events)
    listenerUpdateQueueComplete(state, action: PayloadAction<{folders: Folder[]}>) {
      const {folders} = action.payload

      folders?.forEach(folder => {
        if (folder._id && state.byIds[folder._id]) {
          state.byIds[folder._id].folder = folder
        }
      })
    },
    // Navigate to a folder (or null for root)
    navigateToFolder(state, action: PayloadAction<{folderId: string | null | undefined}>) {
      state.currentFolderId = action.payload.folderId
    },
    // Set folder panel visibility
    panelVisibleSet(state, action: PayloadAction<{panelVisible: boolean}>) {
      const {panelVisible} = action.payload
      state.panelVisible = panelVisible
    },
    // Toggle folder expanded state
    toggleFolderExpanded(state, action: PayloadAction<{folderId: string}>) {
      const {folderId} = action.payload
      const index = state.expandedFolderIds.indexOf(folderId)
      if (index === -1) {
        state.expandedFolderIds.push(folderId)
      } else {
        state.expandedFolderIds.splice(index, 1)
      }
    },
    // Expand a folder
    expandFolder(state, action: PayloadAction<{folderId: string}>) {
      const {folderId} = action.payload
      if (!state.expandedFolderIds.includes(folderId)) {
        state.expandedFolderIds.push(folderId)
      }
    },
    // Collapse a folder
    collapseFolder(state, action: PayloadAction<{folderId: string}>) {
      const {folderId} = action.payload
      const index = state.expandedFolderIds.indexOf(folderId)
      if (index !== -1) {
        state.expandedFolderIds.splice(index, 1)
      }
    },
    // Sort all folders by name
    sort(state) {
      state.allIds.sort((a, b) => {
        const folderA = state.byIds[a].folder.name.current
        const folderB = state.byIds[b].folder.name.current

        if (folderA < folderB) {
          return -1
        } else if (folderA > folderB) {
          return 1
        }
        return 0
      })
    },
    updateComplete(state, action: PayloadAction<{closeDialogId?: string; folder: Folder}>) {
      const {folder} = action.payload
      if (folder._id && state.byIds[folder._id]) {
        state.byIds[folder._id].folder = folder
        state.byIds[folder._id].updating = false
      }
    },
    updateError(state, action: PayloadAction<{folder: Folder; error: HttpError}>) {
      const {error, folder} = action.payload
      const folderId = folder?._id
      if (folderId && state.byIds[folderId]) {
        state.byIds[folderId].error = error
        state.byIds[folderId].updating = false
      }
    },
    updateRequest(
      state,
      action: PayloadAction<{
        closeDialogId?: string
        folder: Folder
        formData: Record<string, any>
      }>
    ) {
      const {folder} = action.payload
      if (folder._id && state.byIds[folder._id]) {
        state.byIds[folder._id].updating = true
      }
    },
    moveRequest(
      state,
      action: PayloadAction<{closeDialogId?: string; folder: Folder; folderId: string | null}>
    ) {
      const {folder} = action.payload
      if (folder._id && state.byIds[folder._id]) {
        state.byIds[folder._id].updating = true
        delete state.byIds[folder._id].error
      }
    },
    moveComplete(state, action: PayloadAction<{closeDialogId?: string; folder: Folder}>) {
      const {folder} = action.payload
      if (folder._id && state.byIds[folder._id]) {
        state.byIds[folder._id].folder = folder
        state.byIds[folder._id].updating = false
      }
    },
    moveError(state, action: PayloadAction<{folder: Folder; error: HttpError}>) {
      const {folder, error} = action.payload
      if (folder._id && state.byIds[folder._id]) {
        state.byIds[folder._id].updating = false
        state.byIds[folder._id].error = error
      }
    }
  }
})

// Epics

// On folder move request:
// - patch folder parent
export const foldersMoveEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(foldersSlice.actions.moveRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {closeDialogId, folder, folderId} = action.payload

      return of(action).pipe(
        debugThrottle(state.debug.badConnection),
        mergeMap(() => {
          const patch = client.observable.patch(folder._id as string)

          if (folderId) {
            // Moving to a parent folder
            return patch
              .set({
                parent: {
                  _ref: folderId,
                  _type: 'reference',
                  _weak: true
                }
              })
              .commit()
          }
          // Moving to root - unset parent
          return patch.unset(['parent']).commit()
        }),
        mergeMap(result =>
          of(
            foldersSlice.actions.moveComplete({
              closeDialogId,
              folder: result as unknown as Folder
            })
          )
        ),
        catchError((error: ClientError) =>
          of(
            foldersSlice.actions.moveError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              },
              folder
            })
          )
        )
      )
    })
  )

// On folder create request:
// - async check to see if folder already exists in the same parent
// - throw if folder already exists
// - otherwise, create new folder
export const foldersCreateEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(foldersSlice.actions.createRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {name, parentId} = action.payload

      return of(action).pipe(
        debugThrottle(state.debug.badConnection),
        checkFolderName(client, name, parentId),
        mergeMap(() =>
          client.observable.create({
            _type: FOLDER_DOCUMENT_NAME,
            name: {
              _type: 'slug',
              current: name
            },
            ...(parentId && {
              parent: {
                _ref: parentId,
                _type: 'reference',
                _weak: true
              }
            })
          })
        ),
        mergeMap(result => of(foldersSlice.actions.createComplete({folder: result as Folder}))),
        catchError((error: ClientError) =>
          of(
            foldersSlice.actions.createError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              },
              name
            })
          )
        )
      )
    })
  )

// On folder delete request:
// - check if folder is empty (no assets, no subfolders)
// - if empty, delete folder
// - otherwise, throw error
export const foldersDeleteEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(foldersSlice.actions.deleteRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {folder} = action.payload

      return of(action).pipe(
        debugThrottle(state.debug.badConnection),
        // Check if folder has any assets
        mergeMap(() =>
          from(
            client.fetch<number>(
              groq`count(*[
                _type in ["sanity.imageAsset", "sanity.fileAsset"]
                && opt.media.folder._ref == $folderId
              ])`,
              {folderId: folder._id}
            )
          )
        ),
        mergeMap(assetCount => {
          if (assetCount > 0) {
            throw new Error(
              `Cannot delete folder with ${assetCount} asset(s). Please move or delete them first.`
            )
          }
          // Check if folder has any subfolders
          return from(
            client.fetch<number>(
              groq`count(*[
                _type == "${FOLDER_DOCUMENT_NAME}"
                && parent._ref == $folderId
              ])`,
              {folderId: folder._id}
            )
          )
        }),
        mergeMap(subfolderCount => {
          if (subfolderCount > 0) {
            throw new Error(
              `Cannot delete folder with ${subfolderCount} subfolder(s). Please delete them first.`
            )
          }
          // Folder is empty, proceed with deletion
          return from(client.observable.delete(folder._id as string))
        }),
        mergeMap(() => of(foldersSlice.actions.deleteComplete({folderId: folder._id as string}))),
        catchError((error: Error | ClientError) =>
          of(
            foldersSlice.actions.deleteError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: (error as ClientError)?.statusCode || 500
              },
              folderId: folder._id as string
            })
          )
        )
      )
    })
  )

// On folder fetch request, fetch all folders
export const foldersFetchEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(foldersSlice.actions.fetchRequest.match),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const {query} = action.payload

      return of(action).pipe(
        debugThrottle(state.debug.badConnection),
        mergeMap(() => client.observable.fetch(query)),
        mergeMap((result: {items?: Folder[]}) => {
          const folders = result?.items || []
          return of(foldersSlice.actions.fetchComplete({folders}))
        }),
        catchError((error: ClientError) => {
          return of(
            foldersSlice.actions.fetchError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              }
            })
          )
        })
      )
    })
  )

// Buffer real-time folder creates and dispatch in batch
export const foldersListenerCreateQueueEpic: MyEpic = action$ =>
  action$.pipe(
    filter(foldersSlice.actions.listenerCreateQueue.match),
    bufferTime(2000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const folders = actions.map(action => action.payload.folder)
      return of(foldersSlice.actions.listenerCreateQueueComplete({folders}))
    })
  )

// Buffer real-time folder deletes and dispatch in batch
export const foldersListenerDeleteQueueEpic: MyEpic = action$ =>
  action$.pipe(
    filter(foldersSlice.actions.listenerDeleteQueue.match),
    bufferTime(2000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const folderIds = actions.map(action => action.payload.folderId)
      return of(foldersSlice.actions.listenerDeleteQueueComplete({folderIds}))
    })
  )

// Buffer real-time folder updates and dispatch in batch
export const foldersListenerUpdateQueueEpic: MyEpic = action$ =>
  action$.pipe(
    filter(foldersSlice.actions.listenerUpdateQueue.match),
    bufferTime(2000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const folders = actions.map(action => action.payload.folder)
      return of(foldersSlice.actions.listenerUpdateQueueComplete({folders}))
    })
  )

// On folder sort request, trigger 1s after any create / update action (buffer against rapid updates)
export const foldersSortEpic: MyEpic = action$ =>
  action$.pipe(
    ofType(
      foldersSlice.actions.createComplete.type,
      foldersSlice.actions.listenerCreateQueueComplete.type,
      foldersSlice.actions.listenerUpdateQueueComplete.type,
      foldersSlice.actions.updateComplete.type
    ),
    bufferTime(1000),
    filter(actions => actions.length > 0),
    mergeMap(() => of(foldersSlice.actions.sort()))
  )

// On folder update request, update folder
export const foldersUpdateEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(foldersSlice.actions.updateRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {folder, formData} = action.payload
      const name = formData?.name as string

      return of(action).pipe(
        debugThrottle(state.debug.badConnection),
        checkFolderName(client, name, folder.parent?._ref, folder._id || undefined),
        mergeMap(() =>
          client.observable
            .patch(folder._id as string)
            .set({
              name: {
                _type: 'slug',
                current: name
              }
            })
            .commit()
        ),
        mergeMap(result =>
          of(
            foldersSlice.actions.updateComplete({
              closeDialogId: folder._id as string,
              folder: result as unknown as Folder
            })
          )
        ),
        catchError((error: ClientError) =>
          of(
            foldersSlice.actions.updateError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              },
              folder
            })
          )
        )
      )
    })
  )

// Selectors

const selectFoldersByIds = (state: RootReducerState) => state.folders.byIds
const selectFoldersAllIds = (state: RootReducerState) => state.folders.allIds

export const selectFolders: Selector<RootReducerState, FolderItem[]> = createSelector(
  [selectFoldersByIds, selectFoldersAllIds],
  (byIds, allIds) => allIds.map((id: string) => byIds[id])
)

export const selectFolderById = createSelector(
  [selectFoldersByIds, (_state: RootReducerState, folderId: string | null) => folderId],
  (byIds, folderId) => (folderId ? byIds[folderId] : null)
)

export const selectCurrentFolderId = (state: RootReducerState) => state.folders.currentFolderId

export const selectCurrentFolder = createSelector(
  [selectFoldersByIds, selectCurrentFolderId],
  (byIds, currentFolderId) => (currentFolderId ? byIds[currentFolderId] : null)
)

// Get all child folders of the current folder
export const selectChildFolders = createSelector(
  [selectFolders, selectCurrentFolderId],
  (folders, currentFolderId) =>
    folders.filter((item: FolderItem) => {
      const parentRef = item.folder.parent?._ref
      if (currentFolderId === null) {
        // Root level - folders with no parent
        return !parentRef
      }
      return parentRef === currentFolderId
    })
)

// Build breadcrumb trail from root to current folder
export const selectBreadcrumbs = createSelector(
  [selectFoldersByIds, selectCurrentFolderId],
  (byIds, currentFolderId) => {
    const breadcrumbs: FolderItem[] = []
    let folderId = currentFolderId

    while (folderId) {
      const folderItem = byIds[folderId]
      if (!folderItem) break
      breadcrumbs.unshift(folderItem)
      folderId = folderItem.folder.parent?._ref || null
    }

    return breadcrumbs
  }
)

// Build breadcrumb trail for a specific folder
export const selectBreadcrumbsForFolder = createSelector(
  [selectFoldersByIds, (_state: RootReducerState, folderId: string | null | undefined) => folderId],
  (byIds, folderId) => {
    const breadcrumbs: FolderItem[] = []
    let currentId = folderId

    while (currentId) {
      const folderItem = byIds[currentId]
      if (!folderItem) break
      breadcrumbs.unshift(folderItem)
      currentId = folderItem.folder.parent?._ref || null
    }

    return breadcrumbs
  }
)

// Map folder reference to react-select option
export const selectFolderSelectOption =
  (folderId?: string | null) =>
  (state: RootReducerState): FolderSelectOption | null => {
    if (!folderId) return null
    const folderItem = state.folders.byIds[folderId]
    if (!folderItem?.folder) return null

    return {
      label: folderItem.folder.name.current,
      value: folderItem.folder._id as string
    }
  }

export const selectFolderOptions = createSelector([selectFolders], (folders = []) => {
  return folders
    .filter(folderItem => folderItem.folder._id)
    .map(folderItem => ({
      label: folderItem.folder.name.current,
      value: folderItem.folder._id as string
    }))
})

// Build folder tree structure for tree view
export const selectFolderTree = createSelector(
  [selectFolders, (state: RootReducerState) => state.folders.expandedFolderIds],
  (folders = [], expandedFolderIds) => {
    const buildTree = (parentId: string | null = null, depth = 0): FolderTreeItem[] => {
      const items: FolderTreeItem[] = []

      const children = folders.filter(item => {
        const itemParentId = item.folder.parent?._ref || null
        return itemParentId === parentId
      })

      children.forEach(child => {
        const folderId = child.folder._id
        if (folderId) {
          const isExpanded = expandedFolderIds.includes(folderId)
          const hasFolderChildren = hasChildren(folderId)

          items.push({
            depth,
            folder: child,
            hasChildren: hasFolderChildren,
            isExpanded
          })

          if (isExpanded) {
            items.push(...buildTree(folderId, depth + 1))
          }
        }
      })

      return items
    }

    const hasChildren = (folderId: string) => {
      return folders.some(item => item.folder.parent?._ref === folderId)
    }

    return buildTree()
  }
)

export const {actions: foldersActions, reducer: foldersReducer} = foldersSlice

export default foldersSlice.reducer

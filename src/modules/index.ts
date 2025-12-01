import {
  type ActionFromReducersMapObject,
  combineReducers,
  type Reducer,
  type StateFromReducersMapObject
} from '@reduxjs/toolkit'
import {combineEpics} from 'redux-observable'

import assetsReducer, {
  assetsDeleteEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsMoveToFolderEpic,
  assetsNavigateToFolderEpic,
  assetsOrderSetEpic,
  assetsSearchEpic,
  assetsSortEpic,
  assetsTagsAddEpic,
  assetsTagsRemoveEpic,
  assetsUnpickEpic,
  assetsUpdateEpic
} from './assets'
import debugReducer from './debug'
import dialogReducer, {
  dialogClearOnAssetUpdateEpic,
  dialogTagCreateEpic,
  dialogTagDeleteEpic
} from './dialog'
import foldersReducer, {
  foldersCreateEpic,
  foldersDeleteEpic,
  foldersFetchEpic,
  foldersListenerCreateQueueEpic,
  foldersListenerDeleteQueueEpic,
  foldersListenerUpdateQueueEpic,
  foldersMoveEpic,
  foldersSortEpic,
  foldersUpdateEpic
} from './folders'
import notificationsReducer, {
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsMoveToFolderCompleteEpic,
  notificationsAssetsTagsAddCompleteEpic,
  notificationsAssetsTagsRemoveCompleteEpic,
  notificationsAssetsUpdateCompleteEpic,
  notificationsAssetsUploadCompleteEpic,
  notificationsFolderCreateCompleteEpic,
  notificationsFolderDeleteCompleteEpic,
  notificationsFolderDeleteErrorEpic,
  notificationsFolderMoveCompleteEpic,
  notificationsFolderUpdateCompleteEpic,
  notificationsGenericErrorEpic,
  notificationsTagCreateCompleteEpic,
  notificationsTagDeleteCompleteEpic,
  notificationsTagUpdateCompleteEpic
} from './notifications'
import searchReducer, {searchFacetTagUpdateEpic} from './search'
import selectedReducer from './selected'
import tagsReducer, {
  tagsCreateEpic,
  tagsDeleteEpic,
  tagsFetchEpic,
  tagsListenerCreateQueueEpic,
  tagsListenerDeleteQueueEpic,
  tagsListenerUpdateQueueEpic,
  tagsSortEpic,
  tagsUpdateEpic
} from './tags'
import uploadsReducer, {
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic
} from './uploads'

export const rootEpic = combineEpics(
  assetsDeleteEpic,
  assetsFetchEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsMoveToFolderEpic,
  assetsNavigateToFolderEpic,
  assetsOrderSetEpic,
  assetsSearchEpic,
  assetsSortEpic,
  assetsTagsAddEpic,
  assetsTagsRemoveEpic,
  assetsUnpickEpic,
  assetsUpdateEpic,
  dialogClearOnAssetUpdateEpic,
  dialogTagCreateEpic,
  dialogTagDeleteEpic,
  foldersCreateEpic,
  foldersDeleteEpic,
  foldersFetchEpic,
  foldersListenerCreateQueueEpic,
  foldersListenerDeleteQueueEpic,
  foldersListenerUpdateQueueEpic,
  foldersMoveEpic,
  foldersSortEpic,
  foldersUpdateEpic,
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsMoveToFolderCompleteEpic,
  notificationsAssetsTagsAddCompleteEpic,
  notificationsAssetsTagsRemoveCompleteEpic,
  notificationsAssetsUpdateCompleteEpic,
  notificationsAssetsUploadCompleteEpic,
  notificationsFolderCreateCompleteEpic,
  notificationsFolderDeleteCompleteEpic,
  notificationsFolderDeleteErrorEpic,
  notificationsFolderMoveCompleteEpic,
  notificationsFolderUpdateCompleteEpic,
  notificationsGenericErrorEpic,
  notificationsTagCreateCompleteEpic,
  notificationsTagDeleteCompleteEpic,
  notificationsTagUpdateCompleteEpic,
  searchFacetTagUpdateEpic,
  tagsCreateEpic,
  tagsDeleteEpic,
  tagsFetchEpic,
  tagsListenerCreateQueueEpic,
  tagsListenerDeleteQueueEpic,
  tagsListenerUpdateQueueEpic,
  tagsSortEpic,
  tagsUpdateEpic,
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic
)

const reducers = {
  assets: assetsReducer,
  debug: debugReducer,
  dialog: dialogReducer,
  folders: foldersReducer,
  notifications: notificationsReducer,
  search: searchReducer,
  selected: selectedReducer,
  tags: tagsReducer,
  uploads: uploadsReducer
}

type ReducersMapObject = typeof reducers

// Workaround to avoid `$CombinedState` ts errors
// source: https://github.com/reduxjs/redux-toolkit/issues/2068#issuecomment-1130796500
// TODO: remove once we use `redux-toolkit` v2
export const rootReducer: Reducer<
  StateFromReducersMapObject<ReducersMapObject>,
  ActionFromReducersMapObject<ReducersMapObject>
> = combineReducers(reducers)

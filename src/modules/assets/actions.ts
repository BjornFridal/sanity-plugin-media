import {createAction} from '@reduxjs/toolkit'
import type {Asset, AssetItem, HttpError, Tag} from '../../types'

export const ASSETS_ACTIONS = {
  moveToFolderComplete: createAction(
    'actions/moveToFolderComplete',
    function prepare({assets, folderId}: {assets: Asset[]; folderId: string}) {
      return {payload: {assets, folderId}}
    }
  ),
  moveToFolderError: createAction(
    'actions/moveToFolderError',
    function prepare({
      assets,
      error,
      folderId
    }: {
      assets: Asset[]
      error: HttpError
      folderId: string
    }) {
      return {payload: {assets, error, folderId}}
    }
  ),
  moveToFolderRequest: createAction(
    'actions/moveToFolderRequest',
    function prepare({assets, folderId}: {assets: Asset[]; folderId: string}) {
      return {payload: {assets, folderId}}
    }
  ),
  tagsAddComplete: createAction(
    'actions/tagsAddComplete',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  tagsAddError: createAction(
    'actions/tagsAddError',
    function prepare({assets, error, tag}: {assets: AssetItem[]; error: HttpError; tag: Tag}) {
      return {payload: {assets, error, tag}}
    }
  ),
  tagsAddRequest: createAction(
    'actions/tagsAddRequest',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  tagsRemoveComplete: createAction(
    'actions/tagsRemoveComplete',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  tagsRemoveError: createAction(
    'actions/tagsRemoveError',
    function prepare({assets, error, tag}: {assets: AssetItem[]; error: HttpError; tag: Tag}) {
      return {payload: {assets, error, tag}}
    }
  ),
  tagsRemoveRequest: createAction(
    'actions/tagsRemoveRequest',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  )
}

import {FOLDER_ROOT_ID} from '../constants'
import type {FolderItem, FolderSelectOption} from '../types'

const getFolderSelectOptions = (folders: FolderItem[]): FolderSelectOption[] => {
  const options: FolderSelectOption[] = []

  const buildOptions = (parentId: string, depth: number) => {
    const children = folders.filter(item => {
      const itemParentId = item.folder.parent?._ref || FOLDER_ROOT_ID
      return itemParentId === parentId
    })

    // Sort children by name
    children.sort((a, b) => {
      const nameA = a.folder.name.current.toLowerCase()
      const nameB = b.folder.name.current.toLowerCase()
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })

    children.forEach(child => {
      // Add current folder
      const prefix = '\u00A0'.repeat(depth * 2)
      if (child.folder._id) {
        options.push({
          label: `${prefix}${child.folder.name.current}`,
          value: child.folder._id
        })

        // Recursively add children
        buildOptions(child.folder._id, depth + 1)
      }
    })
  }

  buildOptions(FOLDER_ROOT_ID, 1)

  return options
}

export default getFolderSelectOptions

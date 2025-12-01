import FolderIcon from '../components/FolderIcon'
import {FOLDER_DOCUMENT_NAME} from '../constants'

export default {
  title: 'Media Folder',
  icon: FolderIcon,
  name: FOLDER_DOCUMENT_NAME,
  type: 'document',
  fields: [
    {
      title: 'Name',
      name: 'name',
      type: 'slug',
      validation: (Rule: any) => Rule.required()
    },
    {
      title: 'Parent Folder',
      name: 'parent',
      type: 'reference',
      to: [{type: FOLDER_DOCUMENT_NAME}],
      weak: true,
      description: 'The parent folder. Leave empty for root level folders.'
    }
  ],
  preview: {
    select: {
      name: 'name',
      parentName: 'parent.name'
    },
    prepare(selection: any) {
      const {name, parentName} = selection
      const folderPath = parentName?.current
        ? `${parentName.current} / ${name?.current}`
        : name?.current
      return {
        media: FolderIcon,
        title: folderPath
      }
    }
  }
}

import {zodResolver} from '@hookform/resolvers/zod'
import type {MutationEvent} from '@sanity/client'
import {FolderIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import groq from 'groq'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {type SubmitHandler, useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'
import {folderFormSchema} from '../../formSchema'
import useTypedSelector from '../../hooks/useTypedSelector'
import useVersionedClient from '../../hooks/useVersionedClient'
import {dialogActions} from '../../modules/dialog'
import {DIALOG_ACTIONS} from '../../modules/dialog/actions'
import {foldersActions, selectFolderById} from '../../modules/folders'
import type {DialogFolderEditProps, Folder, FolderFormData} from '../../types'
import sanitizeFormData from '../../utils/sanitizeFormData'
import Dialog from '../Dialog'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogFolderEditProps
}

const DialogFolderEdit = (props: Props) => {
  const {
    children,
    dialog: {folderId, id}
  } = props

  const client = useVersionedClient()

  const dispatch = useDispatch()
  const folderItem = useTypedSelector(state => selectFolderById(state, String(folderId)))

  // - Generate a snapshot of the current folder
  const [folderSnapshot, setFolderSnapshot] = useState(folderItem?.folder)

  const currentFolder = folderItem ? folderItem?.folder : folderSnapshot
  const generateDefaultValues = (folder?: Folder) => ({
    name: folder?.name?.current || ''
  })

  const {
    // Read the formState before render to subscribe the form state through Proxy
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<FolderFormData>({
    defaultValues: generateDefaultValues(folderItem?.folder),
    mode: 'onChange',
    resolver: zodResolver(folderFormSchema)
  })

  const formUpdating = !folderItem || folderItem?.updating

  const handleClose = () => {
    dispatch(dialogActions.remove({id}))
  }

  // Submit react-hook-form
  const onSubmit: SubmitHandler<FolderFormData> = formData => {
    if (!folderItem?.folder) {
      return
    }
    const sanitizedFormData = sanitizeFormData(formData)
    dispatch(
      foldersActions.updateRequest({
        closeDialogId: folderItem?.folder?._id || undefined,
        folder: folderItem?.folder,
        formData: {
          name: sanitizedFormData.name
        }
      })
    )
  }

  const handleDelete = () => {
    if (!folderItem?.folder) {
      return
    }

    dispatch(
      dialogActions.showConfirmDeleteFolder({
        closeDialogId: folderItem?.folder?._id || undefined,
        folder: folderItem?.folder
      })
    )
  }

  const handleFolderUpdate = useCallback(
    (update: MutationEvent) => {
      const {result, transition} = update
      if (result && transition === 'update') {
        // Regenerate snapshot
        setFolderSnapshot(result as unknown as Folder)
        // Reset react-hook-form
        reset(generateDefaultValues(result as unknown as Folder))
      }
    },
    [reset]
  )

  useEffect(() => {
    if (folderItem?.error) {
      setError('name', {
        message: folderItem.error?.message
      })
    }
  }, [folderItem?.error, setError])

  // - Listen for folder mutations and update snapshot
  useEffect(() => {
    if (!folderItem?.folder) {
      return undefined
    }

    // Remember that Sanity listeners ignore joins, order clauses and projections
    const subscriptionFolder = client
      .listen(groq`*[_id == $id]`, {id: folderItem?.folder._id})
      .subscribe(handleFolderUpdate)

    return () => {
      subscriptionFolder?.unsubscribe()
    }
  }, [client, folderItem?.folder, handleFolderUpdate])

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="space-between">
        <Flex gap={2}>
          {/* Move button */}
          <Button
            disabled={formUpdating}
            fontSize={1}
            icon={FolderIcon}
            mode="ghost"
            onClick={() => {
              if (folderItem?.folder?._id) {
                dispatch(DIALOG_ACTIONS.showFolderMove({folderId: folderItem.folder._id}))
              }
            }}
            text="Move"
          />

          {/* Delete button */}
          <Button
            disabled={formUpdating}
            fontSize={1}
            mode="bleed"
            onClick={handleDelete}
            text="Delete"
            tone="critical"
          />
        </Flex>

        {/* Submit button */}
        <FormSubmitButton
          disabled={formUpdating || !isDirty || !isValid}
          isValid={isValid}
          lastUpdated={folderItem?.folder?._updatedAt}
          onClick={handleSubmit(onSubmit)}
        />
      </Flex>
    </Box>
  )

  if (!currentFolder) {
    return null
  }

  return (
    <Dialog
      animate
      footer={<Footer />}
      header="Edit Folder"
      id={id}
      onClose={handleClose}
      width={1}
    >
      {/* Form fields */}
      <Box as="form" onSubmit={handleSubmit(onSubmit)} padding={4}>
        {/* Deleted notification */}
        {!folderItem && (
          <Card marginBottom={3} padding={3} radius={2} shadow={1} tone="critical">
            <Text size={1}>This folder cannot be found – it may have been deleted.</Text>
          </Card>
        )}

        {/* Hidden button to enable enter key submissions */}
        <button style={{display: 'none'}} tabIndex={-1} type="submit" />

        {/* Title */}
        <FormFieldInputText
          {...register('name')}
          disabled={formUpdating}
          error={errors?.name?.message}
          label="Folder Name"
          name="name"
        />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogFolderEdit

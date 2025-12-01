import {zodResolver} from '@hookform/resolvers/zod'
import {Box, Flex} from '@sanity/ui'
import {type ReactNode, useEffect} from 'react'
import {type SubmitHandler, useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'
import {folderFormSchema} from '../../formSchema'
import useTypedSelector from '../../hooks/useTypedSelector'
import {dialogActions} from '../../modules/dialog'
import {foldersActions} from '../../modules/folders'
import type {DialogFolderCreateProps, FolderFormData} from '../../types'
import sanitizeFormData from '../../utils/sanitizeFormData'
import Dialog from '../Dialog'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogFolderCreateProps
}

const DialogFolderCreate = (props: Props) => {
  const {
    children,
    dialog: {id, parentId}
  } = props

  const dispatch = useDispatch()

  const creating = useTypedSelector(state => state.folders.creating)
  const creatingError = useTypedSelector(state => state.folders.creatingError)

  const {
    // Read the formState before render to subscribe the form state through Proxy
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
    setError
  } = useForm<FolderFormData>({
    defaultValues: {
      name: ''
    },
    mode: 'onChange',
    resolver: zodResolver(folderFormSchema)
  })

  const formUpdating = creating

  const handleClose = () => {
    dispatch(dialogActions.clear())
  }

  // - submit react-hook-form
  const onSubmit: SubmitHandler<FolderFormData> = formData => {
    const sanitizedFormData = sanitizeFormData(formData)

    dispatch(foldersActions.createRequest({name: sanitizedFormData.name, parentId}))
  }

  useEffect(() => {
    if (creatingError) {
      setError('name', {
        message: creatingError?.message
      })
    }
  }, [creatingError, setError])

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="flex-end">
        {/* Submit button */}
        <FormSubmitButton
          disabled={formUpdating || !isDirty || !isValid}
          isValid={isValid}
          onClick={handleSubmit(onSubmit)}
        />
      </Flex>
    </Box>
  )

  return (
    <Dialog
      animate
      footer={<Footer />}
      header="Create Folder"
      id={id}
      onClose={handleClose}
      width={1}
      autoFocus
    >
      {/* Form fields */}
      <Box as="form" onSubmit={handleSubmit(onSubmit)} padding={4}>
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

export default DialogFolderCreate

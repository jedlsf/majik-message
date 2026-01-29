import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { ButtonPrimaryConfirm } from '@/globals/buttons'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

import { isDevEnvironment, parseDateFromISO } from '@/utils/utils'

import { toast } from 'sonner'

import { DividerGlobal } from '@/globals/styled-components'

import DynamicPlaceholder from '@/components/foundations/DynamicPlaceholder'

import CustomDropdown from '@/components/foundations/CustomDropdown'
import DatePicker from '../foundations/DatePicker'

import RowTextItem from '../foundations/RowTextItem'

import CustomInputField from '../foundations/CustomInputField'
import type { MajikUser } from '@renderer/SDK/majik-user/majik-user'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle
} from '@renderer/globals/styled-dialogs'

import type { Address, FullName } from '@renderer/SDK/majik-user/types'
import type { MajikahSession } from '../majikah-session-wrapper/majikah-session'
import { UserGenderOptions } from '@renderer/SDK/majik-user/enums'
import InputAddress from '../foundations/InputAddress'
import InputFullName from '../foundations/InputFullName'

import ScrollableForm from '../foundations/ScrollableForm'
import { YYYYMMDDToDate } from '@renderer/SDK/majik-user/utils'

// Styled components
const BodyContainer = styled.div`
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: column;
  user-select: none;
  height: inherit;
  gap: 5px;
  padding: 25px;
  border-radius: 12px;

  border: 1px solid ${({ theme }) => theme.colors.secondaryBackground};
`

const FormBodyEvent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 3em;

  width: 100%;
  gap: 10px;
`

const DropdownContainer = styled.div`
  width: 100%;
  display: flex;
`

const ButtonContainer = styled.div`
  width: 100%;
`

const StyledButton = styled(ButtonPrimaryConfirm)`
  width: 100%;
`

interface DynamicUserProfileProps {
  session: MajikahSession
  userData: MajikUser
  onUpdate?: (userData: MajikUser) => void
  onSave?: () => void
  onEdit?: (bool: boolean) => void
  onValidated?: (isValid: boolean) => void
}

const defaultAddress: Address = {
  country: 'Philippines',
  city: 'Manila',
  area: 'Unset',
  street: 'Unset',
  building: 'Unset',
  zip: '0000'
}

export const DynamicUserProfile: React.FC<DynamicUserProfileProps> = ({
  session,
  userData,
  onUpdate,
  onSave,
  onEdit,
  onValidated
}) => {
  const [currentUserAccount, setCurrentUserAccount] = useState<MajikUser>(userData)

  const [originalUserAccount, setOriginalUserAccount] = useState<MajikUser>(userData)

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [loading, setIsLoading] = useState<boolean>(false)

  const [, setRefreshKey] = useState<number>(0)

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!!currentUserAccount && !!currentUserAccount?.id) {
      setOriginalUserAccount(currentUserAccount)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserAccount.id])

  const isRefreshingRef = useRef(false)

  const refreshUserData = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    try {
      setIsLoading(true)
      await session.refreshUserData()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        toast.error('Failed to refresh user data.')
      }
    } finally {
      isRefreshingRef.current = false
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    refreshUserData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //User's Profile Info

  const handleChangeDisplayName = (input: string): void => {
    if (!!input && !!currentUserAccount) {
      try {
        setCurrentUserAccount((prev) => {
          prev.displayName = input
          onUpdate?.(prev)
          return prev
        })

        if (isDevEnvironment()) console.log('Current DisplayName: ', currentUserAccount.displayName)
      } catch (error) {
        toast.error(
          `There's a problem updating the user's display name. Please try again or try refreshing. Error: ${error}`
        )
      }
    }

    setIsProceedEnabled(validateForm())
    if (onValidated) onValidated(validateForm())
  }

  const handleChangeFullName = (input: FullName): void => {
    if (!!input && !!currentUserAccount) {
      try {
        setCurrentUserAccount((prev) => {
          prev.setName(input)
          onUpdate?.(prev)
          return prev
        })

        if (isDevEnvironment()) console.log('Current Full Name: ', currentUserAccount.fullName)
      } catch (error) {
        toast.error(
          `There's a problem updating the user's full name. Please try again or try refreshing. Error: ${error}`
        )
      }
    }

    setIsProceedEnabled(validateForm())
    if (onValidated) onValidated(validateForm())
  }

  const handleChangeGender = (input: string): void => {
    if (!!input && !!currentUserAccount) {
      try {
        setCurrentUserAccount((prev) => {
          prev.setGender(input as UserGenderOptions)
          onUpdate?.(prev)
          return prev
        })
        setRefreshKey((prev) => prev + 1)
        if (isDevEnvironment()) console.log('Current Gender: ', currentUserAccount.metadata.gender)
      } catch (error) {
        toast.error(
          `There's a problem updating the user's gender. Please try again or try refreshing. Error: ${error}`
        )
      }
    }

    setIsProceedEnabled(validateForm())
    if (onValidated) onValidated(validateForm())
  }

  const handleChangeBirthday = (input: Date): void => {
    if (!!input && !!currentUserAccount) {
      try {
        setCurrentUserAccount((prev) => {
          prev.setBirthdate(input)
          onUpdate?.(prev)
          return prev
        })

        if (isDevEnvironment())
          console.log('Current Birthday: ', currentUserAccount.metadata.birthdate)
      } catch (error) {
        toast.error(
          `There's a problem updating the user's birthday. Please try again or try refreshing. Error: ${error}`
        )
      }
    }

    setIsProceedEnabled(validateForm())
    if (onValidated) onValidated(validateForm())
  }

  //User's Address

  const handleChangeAddress = (input: Address): void => {
    if (!!input && !!currentUserAccount && !!input.country && !!input.city) {
      try {
        setCurrentUserAccount((prev) => {
          prev.setAddress(input)
          onUpdate?.(prev)
          return prev
        })

        if (isDevEnvironment())
          console.log('Current Address: ', currentUserAccount.metadata.address)
      } catch (error) {
        toast.error(
          `There's a problem updating the user's address. Please try again or try refreshing. Error: ${error}`
        )
      }
    }

    setIsProceedEnabled(validateForm())
    if (onValidated) onValidated(validateForm())
  }

  const handleEditProfile = (): void => {
    setIsEditing(true)
    onEdit?.(true)
  }

  const handleCancelEdit = (): void => {
    setIsEditing(false)
    onEdit?.(false)
  }

  const processUpdateUserAccount = async (): Promise<string> => {
    if (isDevEnvironment()) console.log('Handling Update User Account Button')

    if (!currentUserAccount) {
      throw new Error('Please try refreshing or clearing your session and log in again.')
    }

    setIsLoading(true)

    const userJSON = currentUserAccount.toJSON()

    const response = await session.updateUserProfile(userJSON)

    if (response.success) {
      return response.message
    } else {
      return `Oh no... There's a problem updating your account. ${response.message}`
    }
  }

  const handleUpdateUserAccount = (): void => {
    setIsLoading(true)

    toast.promise(processUpdateUserAccount(), {
      loading: `Updating your account's information...`,
      success: (outputMessage) => {
        setTimeout(() => {
          setIsLoading(false)
          setIsEditing(false)
          onEdit?.(false)
          if (onUpdate && !!currentUserAccount) onUpdate(currentUserAccount)
          onSave?.()
        }, 1000)

        return outputMessage
      },
      error: (error) => {
        setIsLoading(false)
        return `Failed to complete the process: ${error.message}`
      }
    })
  }

  const [isProceedEnabled, setIsProceedEnabled] = useState(false)

  const validateForm = (): boolean => {
    const isAccountSetup = currentUserAccount.validate().isValid

    return isAccountSetup || false
  }

  if (loading) {
    return (
      <BodyContainer className="mainBody">
        <FormBodyEvent className="formBody1">
          <DynamicPlaceholder loading>Loading Data...</DynamicPlaceholder>
        </FormBodyEvent>
      </BodyContainer>
    )
  }

  return (
    <BodyContainer className="mainBody">
      <>
        <ButtonContainer>
          <StyledButton onClick={handleEditProfile}>Edit Profile</StyledButton>
        </ButtonContainer>
      </>

      <FormBodyEvent className="formBody2">
        <RowTextItem
          textKey="Display Name"
          textValue={originalUserAccount?.displayName || 'Unset'}
        />

        <RowTextItem textKey="First Name" textValue={originalUserAccount?.firstName || 'Unset'} />
        <RowTextItem textKey="Last Name" textValue={originalUserAccount?.lastName || 'Unset'} />
        <RowTextItem textKey="Gender" textValue={originalUserAccount?.gender || 'Unset'} />

        <RowTextItem
          textKey="Birthday"
          textValue={parseDateFromISO(originalUserAccount?.metadata.birthdate as string, true)}
        />
        <RowTextItem textKey="Age" textValue={`${originalUserAccount?.age} years old`} />

        <DividerGlobal />

        <RowTextItem
          textKey="Country"
          textValue={originalUserAccount?.metadata.address?.country ?? defaultAddress.country}
        />
        <RowTextItem
          textKey="City"
          textValue={originalUserAccount?.metadata.address?.city ?? defaultAddress.city}
        />
        <RowTextItem
          textKey="Barangay"
          textValue={originalUserAccount?.metadata.address?.area ?? defaultAddress.area}
        />
        <RowTextItem
          textKey="Street"
          textValue={originalUserAccount?.metadata.address?.street ?? defaultAddress.street}
        />
        <RowTextItem
          textKey="Building/House No."
          textValue={originalUserAccount?.metadata.address?.building ?? 'Not Available'}
        />
        <RowTextItem
          textKey="Postal Code"
          textValue={originalUserAccount?.metadata.address?.zip ?? defaultAddress.zip}
        />
      </FormBodyEvent>

      <AlertDialog.Root open={isEditing} onOpenChange={setIsEditing}>
        <AlertDialog.Portal>
          <DialogOverlay>
            <DialogContent ref={dialogRef}>
              <DialogTitle>Update Profile</DialogTitle>
              <DialogDescription>Please fill out all required fields.</DialogDescription>
              <ScrollableForm
                onClickCancel={handleCancelEdit}
                onClickProceed={handleUpdateUserAccount}
                isDisabledProceed={!isProceedEnabled}
                textProceedButton="Save"
              >
                <FormBodyEvent className="formBody1">
                  <CustomInputField
                    required
                    label="Display Name"
                    isLabelHint={false}
                    onChange={handleChangeDisplayName}
                    currentValue={currentUserAccount?.displayName || ''}
                    capitalize="word"
                    maxChar={100}
                  />

                  <InputFullName
                    onUpdate={handleChangeFullName}
                    currentName={currentUserAccount.fullNameObject}
                  />

                  <DropdownContainer>
                    <CustomDropdown
                      required
                      key="ifGender"
                      label="Gender"
                      title="Gender"
                      options={UserGenderOptions}
                      onChange={handleChangeGender}
                      currentValue={currentUserAccount?.gender ?? UserGenderOptions.OTHER}
                    />
                  </DropdownContainer>

                  <DropdownContainer>
                    <DatePicker
                      label="Birthday"
                      onChange={handleChangeBirthday}
                      required
                      settings="birthday"
                      currentValue={
                        currentUserAccount?.metadata?.birthdate
                          ? YYYYMMDDToDate(currentUserAccount?.metadata.birthdate)
                          : new Date()
                      }
                    />
                  </DropdownContainer>
                  <DividerGlobal />
                  <InputAddress
                    onUpdate={handleChangeAddress}
                    currentAddress={currentUserAccount?.metadata.address}
                  />
                </FormBodyEvent>
              </ScrollableForm>
            </DialogContent>
          </DialogOverlay>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </BodyContainer>
  )
}

export default DynamicUserProfile

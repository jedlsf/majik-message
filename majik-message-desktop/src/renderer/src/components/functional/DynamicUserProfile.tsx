/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { toast } from 'sonner'

import { parseDateFromISO } from '@/utils/utils'
import {
  UserGenderOptions,
  type MajikUser,
  type Address,
  type FullName
} from '@thezelijah/majik-user'

import type { MajikahSession } from '../majikah-session-wrapper/majikah-session'

import DynamicPlaceholder from '../foundations/DynamicPlaceholder'
import PopUpFormButton from '../foundations/PopUpFormButton'
import { ChoiceButton } from '@renderer/globals/buttons'
import { MajikMessageIdentitySelector } from '../MajikMessageIdentitySelector'
import { useMajik } from '../majik-context-wrapper/use-majik'
import ThemeToggle from './ThemeToggle'

// Styled Components
const Container = styled.div`
  width: 100%;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
`

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(350px, 1fr));
  gap: 2rem;
`

const Value = styled.div`
  font-size: 1.063rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.5;

  padding: 0.25rem 0.5rem;
`

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.5rem;
`

const Required = styled.span`
  color: #ef4444;
  margin-left: 0.25rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.secondaryBackground};
  border-radius: 8px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.primaryBackground};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(234, 172, 102, 0.1);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary || '#9ca3af'};
  }
`

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.secondaryBackground};
  border-radius: 8px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.primaryBackground};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.secondaryBackground};
  margin: 2rem 0;
`

const Card = styled.div`
  flex: 1 1 200px;
  background: ${({ theme }) => theme.colors.secondaryBackground};
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 150px;
  height: 120px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);

  border: 1px solid transparent;
  transition: all 0.3s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }

  @media (max-width: 1199px) {
    padding: 10px;
  }
`

const CardTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 8px;
`

interface DynamicUserProfileProps {
  session: MajikahSession
  userData: MajikUser
  onUpdate?: (userData: MajikUser) => void
  onSave?: () => void
  onEdit?: (bool: boolean) => void
  onValidated?: (isValid: boolean) => void
  onSignout?: () => void
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
  onValidated,
  onSignout
}) => {
  const { majik } = useMajik()
  const [currentUserAccount, setCurrentUserAccount] = useState<MajikUser>(userData)
  const [originalUserAccount, setOriginalUserAccount] = useState<MajikUser>(userData)

  const [loading, setIsLoading] = useState<boolean>(false)
  const [isProceedEnabled, setIsProceedEnabled] = useState(false)

  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (!!currentUserAccount && !!currentUserAccount?.id) {
      setOriginalUserAccount(currentUserAccount)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserAccount.id])

  const refreshUserData = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    try {
      setIsLoading(true)
      await session.refreshUserData()
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
  }, [refreshUserData])

  const validateForm = (): boolean => {
    const isAccountSetup = currentUserAccount.validate().isValid
    return isAccountSetup || false
  }

  const handleFieldChange = (field: string, value: any): void => {
    try {
      setCurrentUserAccount((prev) => {
        const updated = prev.clone()

        if (field === 'displayName') {
          updated.displayName = value
        } else if (field === 'firstName' || field === 'lastName') {
          const name: FullName = {
            first_name: field === 'firstName' ? value : prev.firstName,
            last_name: field === 'lastName' ? value : prev.lastName
          }
          updated.setName(name)
        } else if (field === 'gender') {
          updated.setGender(value as UserGenderOptions)
        } else if (field === 'birthdate') {
          updated.setBirthdate(value)
        } else if (field.startsWith('address.')) {
          const addressField = field.split('.')[1]
          const currentAddress = prev.metadata.address || defaultAddress
          const newAddress = { ...currentAddress, [addressField]: value }
          updated.setAddress(newAddress)
        }

        onUpdate?.(updated)
        return updated
      })

      const isValid = validateForm()
      setIsProceedEnabled(isValid)
      if (onValidated) onValidated(isValid)
    } catch (error) {
      toast.error(`Failed to update ${field}: ${error}. Please try again.`)
    }
  }

  const handleCancelEdit = (): void => {
    setCurrentUserAccount(originalUserAccount)
    onEdit?.(false)
  }

  const handleSaveProfile = async (): Promise<void> => {
    if (!currentUserAccount) {
      toast.error('Please try refreshing or clearing your session and log in again.')
      return
    }

    setIsLoading(true)

    try {
      const userJSON = currentUserAccount.toJSON()
      const response = await session.updateUserProfile(userJSON)

      if (response.success) {
        toast.success(response.message)
        setOriginalUserAccount(currentUserAccount)
        onEdit?.(false)
        if (onUpdate) onUpdate(currentUserAccount)
        onSave?.()
      } else {
        toast.error(`Failed to update your account. ${response.message}`)
      }
    } catch (error: any) {
      toast.error(`Failed to complete the process: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async (): Promise<void> => {
    await session.signOut()
    majik.clearAllCaches()
    onSignout?.()
  }

  if (loading) {
    return (
      <Container>
        <LoadingOverlay>
          <DynamicPlaceholder loading>Loading your profile...</DynamicPlaceholder>
        </LoadingOverlay>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>My Profile</Title>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 15, alignItems: 'center' }}>
          <ThemeToggle size={45} />
          <ChoiceButton variant="secondary" onClick={handleSignOut}>
            Log Out
          </ChoiceButton>
          <PopUpFormButton
            scrollable
            text="Edit Profile"
            modal={{
              title: 'Edit Profile',
              description: 'Update your personal information and address details.'
            }}
            buttons={{
              cancel: {
                text: 'Cancel',
                onClick: handleCancelEdit
              },
              confirm: {
                text: loading ? 'Saving...' : 'Save Changes',
                isDisabled: !isProceedEnabled || loading,
                onClick: handleSaveProfile
              }
            }}
          >
            <FormGroup>
              <FormLabel>
                Display Name<Required>*</Required>
              </FormLabel>
              <Input
                type="text"
                value={currentUserAccount?.displayName || ''}
                onChange={(e) => handleFieldChange('displayName', e.target.value)}
                placeholder="Enter your display name"
                maxLength={100}
              />
            </FormGroup>

            <InputRow>
              <FormGroup>
                <FormLabel>
                  First Name<Required>*</Required>
                </FormLabel>
                <Input
                  type="text"
                  value={currentUserAccount?.firstName || ''}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  placeholder="First name"
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  Last Name<Required>*</Required>
                </FormLabel>
                <Input
                  type="text"
                  value={currentUserAccount?.lastName || ''}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  placeholder="Last name"
                />
              </FormGroup>
            </InputRow>

            <InputRow>
              <FormGroup>
                <FormLabel>
                  Gender<Required>*</Required>
                </FormLabel>
                <Select
                  value={currentUserAccount?.gender || UserGenderOptions.OTHER}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                >
                  {Object.values(UserGenderOptions).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  Date of Birth<Required>*</Required>
                </FormLabel>
                <Input
                  type="date"
                  value={currentUserAccount?.metadata?.birthdate || ''}
                  onChange={(e) => handleFieldChange('birthdate', new Date(e.target.value))}
                  data-private
                />
              </FormGroup>
            </InputRow>

            <Divider />

            <FormGroup>
              <FormLabel>
                Country<Required>*</Required>
              </FormLabel>
              <Input
                type="text"
                value={currentUserAccount?.metadata.address?.country || defaultAddress.country}
                onChange={(e) => handleFieldChange('address.country', e.target.value)}
                placeholder="Country"
                data-private
              />
            </FormGroup>

            <InputRow>
              <FormGroup>
                <FormLabel>
                  City<Required>*</Required>
                </FormLabel>
                <Input
                  type="text"
                  value={currentUserAccount?.metadata.address?.city || defaultAddress.city}
                  onChange={(e) => handleFieldChange('address.city', e.target.value)}
                  placeholder="City"
                  data-private
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Barangay</FormLabel>
                <Input
                  type="text"
                  value={currentUserAccount?.metadata.address?.area || defaultAddress.area}
                  onChange={(e) => handleFieldChange('address.area', e.target.value)}
                  placeholder="Barangay"
                  data-private
                />
              </FormGroup>
            </InputRow>

            <FormGroup>
              <FormLabel>Street</FormLabel>
              <Input
                type="text"
                value={currentUserAccount?.metadata.address?.street || defaultAddress.street}
                onChange={(e) => handleFieldChange('address.street', e.target.value)}
                placeholder="Street address"
                data-private
              />
            </FormGroup>

            <InputRow>
              <FormGroup>
                <FormLabel>Building/House No.</FormLabel>
                <Input
                  type="text"
                  value={currentUserAccount?.metadata.address?.building || ''}
                  onChange={(e) => handleFieldChange('address.building', e.target.value)}
                  placeholder="Building or house number"
                  data-private
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  Postal Code<Required>*</Required>
                </FormLabel>
                <Input
                  type="text"
                  value={currentUserAccount?.metadata.address?.zip || defaultAddress.zip}
                  onChange={(e) => handleFieldChange('address.zip', e.target.value)}
                  placeholder="Postal code"
                  data-private
                />
              </FormGroup>
            </InputRow>
          </PopUpFormButton>
        </div>
      </Header>
      <p className="text-right m-5!" data-private>
        Logged in as <strong>{currentUserAccount.email}</strong>{' '}
      </p>

      <Grid>
        <Card>
          <MajikMessageIdentitySelector />
        </Card>

        <Card>
          <CardTitle>Display Name</CardTitle>
          <Value data-private>{originalUserAccount?.displayName || 'Not set'}</Value>
        </Card>

        <Card>
          <CardTitle>Full Name</CardTitle>
          <Value data-private>{originalUserAccount?.fullName || 'Not set'}</Value>
        </Card>

        <Card>
          <CardTitle>Gender</CardTitle>
          <Value data-private>{originalUserAccount?.gender || 'Unspecified'}</Value>
        </Card>

        <Card>
          <CardTitle>Birthday</CardTitle>
          {!originalUserAccount?.metadata?.birthdate?.trim() ? (
            <Value>Not Available</Value>
          ) : (
            <Value data-private>
              {parseDateFromISO(originalUserAccount.metadata.birthdate, true)} |{' '}
              {originalUserAccount?.age} years old
            </Value>
          )}
        </Card>

        <Card>
          <CardTitle>Address</CardTitle>
          <Value data-private>{originalUserAccount?.address || 'Not Available'}</Value>
        </Card>
      </Grid>
    </Container>
  )
}

export default DynamicUserProfile

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  NotePencilIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ArrowClockwiseIcon
} from '@phosphor-icons/react'
import ThreadMail from './ThreadMail'
import type {
  MajikMessageMail,
  MajikMessageThreadID,
  MajikMessageThreadSummary
} from '@thezelijah/majik-message'
import { SectionTitleFrame } from '@renderer/globals/styled-components'
import PopUpFormButton from '@renderer/components/foundations/PopUpFormButton'
import UserAuth from '@renderer/components/foundations/UserAuth'
import { useMajikah } from '@renderer/components/majikah-session-wrapper/use-majikah'
import type { MajikMessageDatabase } from '@renderer/components/majik-context-wrapper/majik-message-database'
import { toast } from 'sonner'

const RootContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  border-radius: 8px;
  padding: 8px;
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`
const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ReloadButton = styled.button`
  background: none;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }

  &:active {
    transform: scale(0.98);
  }
`

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const PageInfo = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`

const PaginationButton = styled.button<{ $disabled?: boolean }>`
  background: none;
  border: 1px solid ${(props) => (props.$disabled ? '#e5e7eb' : '#d1d5db')};
  padding: 6px;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.$disabled ? '#d1d5db' : '#374151')};
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.$disabled ? 'transparent' : '#f3f4f6')};
    border-color: ${(props) => (props.$disabled ? '#e5e7eb' : '#9ca3af')};
  }

  &:active {
    transform: ${(props) => (props.$disabled ? 'none' : 'scale(0.95)')};
  }
`

const ThreadsList = styled.div`
  width: 100%;
`

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
`

const EmptyStateTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`

const EmptyStateMessage = styled.p`
  font-size: 14px;
  margin: 0;
`

const PAGINATION_LIMIT = 50

interface EmailThreadsProps {
  majik: MajikMessageDatabase
  onUpdate?: (updatedInstance: MajikMessageDatabase) => void
  onPageChange?: (page: number) => void
  onReload?: () => void
  onToggleStar?: (threadId: MajikMessageThreadID) => void
  onDelete?: (threadId: MajikMessageThreadID) => void
  onToggleRead?: (threadId: MajikMessageThreadID) => void
  onThreadClick?: (threadId: MajikMessageThreadID) => void
}

const EmailThreads: React.FC<EmailThreadsProps> = ({
  majik,
  onPageChange,
  onReload,
  onToggleStar,
  onDelete,
  onToggleRead,
  onThreadClick
}) => {
  const { majikah } = useMajikah()

  const [fetchedThreads, setFetchedThreads] = useState<MajikMessageThreadSummary[]>([])

  const [loading, setIsLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [allowNextPage] = useState(false)

  const isRefreshingRef = useRef(false)

  const [newMessageText, setNewMessageText] = useState<string>('')

  const [isCreatingMessage, setIsCreatingMessage] = useState<boolean>(false)

  const messagesRef = useRef<{ insertMessage: (message: MajikMessageMail) => Promise<void> }>(null)

  const refreshThreads = useCallback(async () => {
    if (!majikah?.isAuthenticated) return

    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    try {
      setIsLoading(true)
      //   const fetchResponse = await majik.getConversations()
      //   const conversations = fetchResponse.conversations

      //   setFetchedThreads(conversations)

      // setAllowNextPage(conversations.length > 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error('Failed to refresh threads', { description: error?.message })
      }
    } finally {
      isRefreshingRef.current = false
      setIsLoading(false)
      setIsCreatingMessage(false)
    }
  }, [majik, majikah.isAuthenticated])

  useEffect(() => {
    refreshThreads()
  }, [refreshThreads])

  const handleMessageTextUpdate = (text: string): void => {
    setNewMessageText(text || '')
  }

  const handlePreviousPage = (): void => {
    if (pageIndex > 1) {
      const newPage = pageIndex - 1
      setPageIndex(newPage)
      onPageChange?.(newPage)
    }
  }

  const handleNextPage = (): void => {
    if (!allowNextPage) return

    const newPage = pageIndex + 1
    setPageIndex(newPage)
    onPageChange?.(newPage)
  }

  const handleReload = (): void => {
    onReload?.()
  }

  const isPreviousDisabled = pageIndex <= 1
  const isNextDisabled = !allowNextPage

  const isUserRestricted = useMemo(() => {
    return majik?.currentIdentity?.isRestricted() || false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majik, majik.user?.id, majik.getActiveAccount()?.id])

  if (!majikah?.isAuthenticated) {
    return <UserAuth />
  }

  return (
    <RootContainer>
      <Header>
        <SectionTitleFrame>
          <Row>
            <h2>Threads</h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 15 }}>
              <PopUpFormButton
                icon={NotePencilIcon}
                text="New Thread"
                disabled={isUserRestricted}
                modal={{
                  title: 'New Message',
                  description: 'Send a new message to your contacts.'
                }}
                buttons={{
                  cancel: {
                    text: 'Cancel'
                  },
                  confirm: {
                    text: 'Send',
                    // isDisabled: !newMessageText?.trim(),
                    hide: true
                  }
                }}
                // isOpen={isCreatingMessage}
                // onOpenChange={(open) => setIsCreatingMessage(open)}
              >
                {/* <NewMessageForm
                  majik={majik}
                  onSend={refreshThreads}
                  onUpdate={handleMessageTextUpdate}
                /> */}
                <></>
              </PopUpFormButton>

              {/* <PopUpFormButton scrollable={true} icon={PlusIcon} text="Create Account">
                       <></>
                     </PopUpFormButton> */}

              <Controls>
                <ReloadButton onClick={handleReload} aria-label="Reload threads">
                  <ArrowClockwiseIcon size={16} />
                  Reload
                </ReloadButton>
                <PaginationContainer>
                  <PageInfo>
                    {/* {totalThreads > 0 ? `${startThread}-${endThread} of ${totalThreads}` : 'No threads'} */}
                  </PageInfo>
                  <PaginationButton
                    onClick={handlePreviousPage}
                    $disabled={isPreviousDisabled}
                    disabled={isPreviousDisabled}
                    aria-label="Previous page"
                  >
                    <CaretLeftIcon size={16} />
                  </PaginationButton>
                  <PaginationButton
                    onClick={handleNextPage}
                    $disabled={isNextDisabled}
                    disabled={isNextDisabled}
                    aria-label="Next page"
                  >
                    <CaretRightIcon size={16} />
                  </PaginationButton>
                </PaginationContainer>
              </Controls>
            </div>
          </Row>
        </SectionTitleFrame>
      </Header>

      <ThreadsList>
        {fetchedThreads.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>No messages</EmptyStateTitle>
            <EmptyStateMessage>
              Your inbox is empty. New messages will appear here.
            </EmptyStateMessage>
          </EmptyState>
        ) : (
          fetchedThreads.map((thread) => (
            <ThreadMail
              key={thread.id}
              thread={thread}
              currentUserPublicKey={majik.currentIdentity!.publicKey}
              onToggleStar={onToggleStar}
              onDelete={onDelete}
              onToggleRead={onToggleRead}
              onClick={onThreadClick}
            />
          ))
        )}
      </ThreadsList>
    </RootContainer>
  )
}

export default EmailThreads

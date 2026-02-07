import React, { useState } from 'react'
import styled from 'styled-components'
import { EnvelopeIcon, EnvelopeOpenIcon, StarIcon, TrashIcon } from '@phosphor-icons/react'
import moment from 'moment'

import type {
  MajikMessagePublicKey,
  MajikMessageThreadID,
  MajikMessageThreadSummary
} from '@thezelijah/majik-message'

interface ThreadMailProps {
  thread: MajikMessageThreadSummary
  currentUserPublicKey: MajikMessagePublicKey
  onToggleStar?: (threadId: MajikMessageThreadID) => void
  onDelete?: (threadId: MajikMessageThreadID) => void
  onToggleRead?: (threadId: MajikMessageThreadID) => void
  onClick?: (threadId: MajikMessageThreadID) => void
}

const RootContainer = styled.div<{ $isUnread: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: ${(props) => (props.$isUnread ? '#f0f4ff' : '#ffffff')};
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;

  &:hover {
    background-color: #f9fafb;

    .action-buttons {
      opacity: 1;
      visibility: visible;
    }
  }
`

const StarButton = styled.button<{ $isStarred: boolean }>`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: ${(props) => (props.$isStarred ? '#fbbf24' : '#9ca3af')};
  transition: color 0.2s ease;

  &:hover {
    color: ${(props) => (props.$isStarred ? '#f59e0b' : '#6b7280')};
  }
`

const ParticipantsSection = styled.div<{ $hasUnread: boolean }>`
  min-width: 200px;
  max-width: 200px;
  font-weight: ${(props) => (props.$hasUnread ? '600' : '400')};
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 16px;
`

const ContentSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  margin-right: 16px;
`

const SubjectLine = styled.div<{ $isUnread: boolean }>`
  font-size: 14px;
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MessagePreview = styled.div`
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MetaSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
`

const UnreadBadge = styled.span`
  background-color: #3b82f6;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
`

const Timestamp = styled.div<{ $isUnread: boolean }>`
  font-size: 12px;
  color: ${(props) => (props.$isUnread ? '#111827' : '#6b7280')};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};
  min-width: 80px;
  text-align: right;
`

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
`

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 4px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background-color: #e5e7eb;
    color: #111827;
  }
`

const ThreadMail: React.FC<ThreadMailProps> = ({
  thread,
  currentUserPublicKey,
  onToggleStar,
  onDelete,
  onToggleRead,
  onClick
}) => {
  const [isStarred, setIsStarred] = useState(thread.starred)

  const handleStarClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setIsStarred(!isStarred)
    onToggleStar?.(thread.id)
  }

  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onDelete?.(thread.id)
  }

  const handleToggleReadClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onToggleRead?.(thread.id)
  }

  const handleRowClick = (): void => {
    onClick?.(thread.id)
  }

  // Filter out current user from participants
  const otherParticipants = thread.participants.filter((p) => p !== currentUserPublicKey)

  // Format participants display
  const participantsDisplay =
    otherParticipants.length > 0 ? otherParticipants.join(', ') : 'No participants'

  // Get subject from metadata or use a default
  const subject = thread.latest_message.metadata?.subject || '(No Subject)'

  // Format timestamp
  const relativeTime = moment(thread.latest_message_timestamp).fromNow()

  return (
    <RootContainer $isUnread={thread.has_unread} onClick={handleRowClick}>
      <StarButton
        $isStarred={isStarred}
        onClick={handleStarClick}
        aria-label={isStarred ? 'Unstar thread' : 'Star thread'}
      >
        <StarIcon size={20} weight={isStarred ? 'fill' : 'regular'} />
      </StarButton>

      <ParticipantsSection $hasUnread={thread.has_unread}>
        {participantsDisplay}
      </ParticipantsSection>

      <ContentSection>
        <SubjectLine $isUnread={thread.has_unread}>{subject}</SubjectLine>
        <MessagePreview>{thread.latest_message.message}</MessagePreview>
      </ContentSection>

      <MetaSection>
        {thread.has_unread && thread.unread_count > 0 && (
          <UnreadBadge>{thread.unread_count}</UnreadBadge>
        )}
      </MetaSection>

      <Timestamp $isUnread={thread.has_unread}>{relativeTime}</Timestamp>

      <ActionButtons className="action-buttons">
        <ActionButton
          onClick={handleToggleReadClick}
          aria-label={thread.has_unread ? 'Mark as read' : 'Mark as unread'}
        >
          {thread.has_unread ? <EnvelopeOpenIcon size={18} /> : <EnvelopeIcon size={18} />}
        </ActionButton>
        <ActionButton onClick={handleDeleteClick} aria-label="Delete thread">
          <TrashIcon size={18} />
        </ActionButton>
      </ActionButtons>
    </RootContainer>
  )
}

export default ThreadMail

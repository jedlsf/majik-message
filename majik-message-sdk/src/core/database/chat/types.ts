import {
  MajikMessageAccountID,
  MajikMessageChatID,
  MajikMessagePublicKey,
} from "../../types";

export interface MajikMessageChatJSON {
  id: MajikMessageChatID;
  conversation_id: string;
  account: MajikMessageAccountID;
  message: string;
  sender: MajikMessagePublicKey;
  recipients: MajikMessagePublicKey[];
  timestamp: string;
  expires_at: string;
  read_by: string[];
  permanent: boolean;
}

export type RedisKey = string;

import type { PageResult } from "../community/types";

export interface MemberConversation {
  id: string;
  circleId: string;
  circleName: string;
  peer: { id: string; alias: string };
  updatedAt: string;
  unreadCount: number;
  blockedByMe: boolean;
  canSend: boolean;
}

export interface MemberMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: MemberConversation;
  messages: PageResult<MemberMessage>;
}

export interface MessageReport {
  id: string;
  conversationId: string;
  reportedMessage: MemberMessage;
  reporterAlias: string;
  senderAlias: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface MemberBlock {
  userId: string;
  alias: string;
  createdAt: string;
}

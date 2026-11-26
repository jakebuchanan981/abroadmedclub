export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Circle {
  id: string;
  name: string;
  kind: "support" | "destination" | "travel";
  description: string;
  countryCode: string | null;
  city: string | null;
  startsOn: string | null;
  endsOn: string | null;
  ownerAlias: string | null;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  myMembership: {
    status: "pending" | "active" | "declined";
    alias: string;
    allowMessages: boolean;
  } | null;
  canManage: boolean;
}

export interface CircleMember {
  userId: string;
  alias: string;
  role: "owner" | "member";
  allowMessages: boolean;
}

export interface CirclePost {
  id: string;
  circleId: string;
  authorId: string;
  authorAlias: string;
  body: string;
  createdAt: string;
  status: "visible" | "removed";
  canDelete: boolean;
}

export interface MembershipRequest {
  userId: string;
  alias: string;
  requestedAt: string;
}

export interface CommunityReport {
  id: string;
  circleId: string;
  circleName: string;
  post: CirclePost;
  reporterAlias: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface MessagingIdentity {
  circleId: string;
  circleName: string;
  userId: string;
  alias: string;
  allowMessages: boolean;
}

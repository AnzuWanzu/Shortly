export type LinkRecord = {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string;
  createdAt: Date;
};

export type CreateLinkRecordInput = {
  originalUrl: string;
  slug: string;
  userId: string;
};

export type CreateOwnedLinkInput = {
  originalUrl: string;
  userId: string;
};

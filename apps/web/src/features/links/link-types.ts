export type ShortLink = {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string;
  createdAt: string;
};

export type CreateLinkInput = {
  originalUrl: string;
};

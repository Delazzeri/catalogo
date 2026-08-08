export type ProjectType = 'design' | 'code';

export type LinkType = 'github' | 'vercel' | 'live_site' | 'instagram' | 'ebook' | 'other';

export type ProjectLink = {
  id: string;
  label: string;
  url: string;
  type: LinkType;
};

export type TagCategory = 'topic' | 'tool';

export type Tag = {
  id: string;
  namePt: string;
  nameEn: string;
  slug: string;
  category: TagCategory;
  iconUrl: string | null;
};

export type Project = {
  id: string;
  slug: string;
  type: ProjectType;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  coverImageUrl: string;
  bannerImageUrl: string;
  pdfUrl: string | null;
  pdfPageCount: number | null;
  pdfPageAspectRatio: number | null;
  position: number;
  published: boolean;
  links: ProjectLink[];
  tags: Tag[];
};

export type HeroMediaType = 'image' | 'video';

export type HeroSlide = {
  id: string;
  mediaType: HeroMediaType;
  mediaUrl: string;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  projectSlug: string | null;
  projectType: ProjectType | null;
  published: boolean;
  position: number;
};

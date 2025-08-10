export type NewsItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt?: string;
  headline: string;
};

export type HeadlineGroup = {
  id: string;
  title: string; // AI-generated headline
  items: NewsItem[]; // original site headlines
  topic: string;
};

export type Overview = {
  title: string;
  bullets: string[];
};



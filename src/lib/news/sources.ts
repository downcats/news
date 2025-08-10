export type NewsSource = {
  name: string;
  url: string;
  homepage?: string;
};

export const NEWS_SOURCES: NewsSource[] = [
  { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml", homepage: "https://www.bbc.com/news" },
  { name: "Reuters Top News", url: "http://feeds.reuters.com/reuters/topNews", homepage: "https://www.reuters.com" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", homepage: "https://www.theverge.com" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", homepage: "https://news.ycombinator.com" },
  { name: "NYTimes Home", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", homepage: "https://www.nytimes.com" },
  { name: "NYTimes World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", homepage: "https://www.nytimes.com/section/world" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss", homepage: "https://www.theguardian.com/world" },
  { name: "The Guardian Technology", url: "https://www.theguardian.com/technology/rss", homepage: "https://www.theguardian.com/technology" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", homepage: "https://www.aljazeera.com" },
  { name: "CNN Top", url: "http://rss.cnn.com/rss/cnn_topstories.rss", homepage: "https://www.cnn.com" },
  { name: "Fox News Latest", url: "http://feeds.foxnews.com/foxnews/latest", homepage: "https://www.foxnews.com" },
  { name: "NPR News", url: "https://www.npr.org/rss/rss.php?id=1001", homepage: "https://www.npr.org" },
  { name: "Economist Latest", url: "https://www.economist.com/latest/rss.xml", homepage: "https://www.economist.com" },
  { name: "WSJ World", url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", homepage: "https://www.wsj.com" },
  { name: "Financial Times World", url: "http://feeds.feedburner.com/ft/world", homepage: "https://www.ft.com/world" },
  { name: "CNBC Top", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", homepage: "https://www.cnbc.com" },
  { name: "Ars Technica", url: "http://feeds.arstechnica.com/arstechnica/index/", homepage: "https://arstechnica.com" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", homepage: "https://www.wired.com" },
  { name: "Engadget", url: "https://www.engadget.com/rss.xml", homepage: "https://www.engadget.com" },
  { name: "TechCrunch", url: "http://feeds.feedburner.com/TechCrunch/", homepage: "https://techcrunch.com" },
  { name: "Gizmodo", url: "https://gizmodo.com/rss", homepage: "https://gizmodo.com" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", homepage: "https://www.bleepingcomputer.com" },
  { name: "The Verge Circuit Breaker", url: "https://www.theverge.com/circuitbreaker/rss/index.xml", homepage: "https://www.theverge.com/circuitbreaker" },
  { name: "Reddit r/worldnews", url: "https://www.reddit.com/r/worldnews/.rss", homepage: "https://www.reddit.com/r/worldnews" },
];



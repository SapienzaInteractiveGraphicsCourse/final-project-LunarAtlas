const WIKIPEDIA_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKIPEDIA_SEARCH_BASE = 'https://en.wikipedia.org/wiki/Special:Search?search=';
const COMMONS_API_BASE = 'https://commons.wikimedia.org/w/api.php';

function unique(items) {
  return [...new Set(items)];
}

function getCandidateTitles(feature) {
  const name = feature.name.trim();
  const candidates = [name];

  if (feature.type === 'crater') {
    candidates.unshift(`${name} (lunar crater)`);
    candidates.push(`${name} crater`);
  } else if (feature.type === 'mare') {
    candidates.push(`${name} (Moon)`);
  } else if (feature.type === 'mountain') {
    candidates.push(`${name} (Moon)`);
    candidates.push(`${name} lunar mountain range`);
  } else if (feature.type === 'valley') {
    candidates.push(`${name} (lunar valley)`);
    candidates.push(`${name} (Moon)`);
  } else if (feature.type === 'landing') {
    candidates.push(`${name} moon landing`);
  }

  return unique(candidates);
}

async function fetchWikipediaSummary(title) {
  const response = await fetch(`${WIKIPEDIA_SUMMARY_BASE}${encodeURIComponent(title)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Wikipedia summary request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data || data.type === 'disambiguation') return null;
  if (!data.extract && !data.content_urls?.desktop?.page) return null;

  return {
    title: data.title || title,
    description: data.extract || 'No description available from Wikipedia for this feature.',
    articleUrl: data.content_urls?.desktop?.page || null,
    imageUrl: data.originalimage?.source || data.thumbnail?.source || null
  };
}

async function fetchFirstWikipediaSummary(feature) {
  const candidates = getCandidateTitles(feature);
  for (const title of candidates) {
    const summary = await fetchWikipediaSummary(title);
    if (summary) return summary;
  }
  return null;
}

async function fetchCommonsImages(queryTerm, limit = 3) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${queryTerm} moon`,
    gsrnamespace: '6',
    gsrlimit: String(limit * 2),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '900',
    format: 'json',
    origin: '*'
  });

  const response = await fetch(`${COMMONS_API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wikimedia Commons request failed (${response.status})`);
  }

  const data = await response.json();
  const pages = Object.values(data.query?.pages || {});
  const images = [];

  for (const page of pages) {
    const imageInfo = page.imageinfo && page.imageinfo[0];
    if (!imageInfo) continue;

    const imageUrl = imageInfo.thumburl || imageInfo.url;
    if (!imageUrl) continue;

    images.push({
      imageUrl,
      sourceLabel: 'Wikimedia Commons',
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`
    });

    if (images.length >= limit) break;
  }

  return images;
}

export async function fetchFeatureDetails(feature) {
  const summary = await fetchFirstWikipediaSummary(feature);
  const commonsImages = await fetchCommonsImages(feature.name, 3);

  const images = [];
  if (summary?.imageUrl) {
    images.push({
      imageUrl: summary.imageUrl,
      sourceLabel: 'Wikipedia',
      sourceUrl: summary.articleUrl || `${WIKIPEDIA_SEARCH_BASE}${encodeURIComponent(feature.name)}`
    });
  }

  for (const image of commonsImages) {
    if (!images.some(existing => existing.imageUrl === image.imageUrl)) {
      images.push(image);
    }
  }

  return {
    title: summary?.title || feature.name,
    description: summary?.description || 'No Wikipedia summary was found for this feature.',
    articleUrl: summary?.articleUrl || `${WIKIPEDIA_SEARCH_BASE}${encodeURIComponent(feature.name)}`,
    images: images.slice(0, 4)
  };
}

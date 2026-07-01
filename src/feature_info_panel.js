import { fetchFeatureDetails } from './feature_details_service.js';

export function createFeatureInfoPanel() {
  const panel = document.getElementById('feature-panel');
  const closeButton = document.getElementById('feature-panel-close');
  const titleEl = document.getElementById('feature-panel-title');
  const sourceLinkEl = document.getElementById('feature-panel-source-link');
  const descriptionEl = document.getElementById('feature-panel-description');
  const imagesEl = document.getElementById('feature-panel-images');
  let requestToken = 0;

  closeButton.addEventListener('click', () => {
    panel.classList.add('feature-panel--hidden');
  });

  function showLoading(featureName) {
    panel.classList.remove('feature-panel--hidden');
    titleEl.textContent = featureName;
    sourceLinkEl.href = '#';
    sourceLinkEl.textContent = 'Loading source...';
    descriptionEl.textContent = 'Loading description and images...';
    imagesEl.innerHTML = '';
  }

  function renderImage(image) {
    const wrapper = document.createElement('a');
    wrapper.className = 'feature-panel__image-link';
    wrapper.href = image.sourceUrl;
    wrapper.target = '_blank';
    wrapper.rel = 'noopener noreferrer';
    wrapper.title = `Open source on ${image.sourceLabel}`;

    const img = document.createElement('img');
    img.className = 'feature-panel__image';
    img.src = image.imageUrl;
    img.alt = `Reference image from ${image.sourceLabel}`;
    img.loading = 'lazy';

    wrapper.appendChild(img);
    return wrapper;
  }

  function renderData(data) {
    panel.classList.remove('feature-panel--hidden');
    titleEl.textContent = data.title;
    sourceLinkEl.href = data.articleUrl;
    sourceLinkEl.textContent = 'Wikipedia article';
    descriptionEl.textContent = data.description;
    imagesEl.innerHTML = '';

    if (data.images.length === 0) {
      const message = document.createElement('p');
      message.className = 'feature-panel__images-empty';
      message.textContent = 'No online image found for this feature.';
      imagesEl.appendChild(message);
      return;
    }

    for (const image of data.images) {
      imagesEl.appendChild(renderImage(image));
    }
  }

  function renderError(featureName, error) {
    panel.classList.remove('feature-panel--hidden');
    titleEl.textContent = featureName;
    sourceLinkEl.href = '#';
    sourceLinkEl.textContent = 'Source unavailable';
    descriptionEl.textContent = `Unable to load online details: ${error.message}`;
    imagesEl.innerHTML = '';
    console.error('Feature details loading failed:', error);
  }

  async function showFeature(feature) {
    requestToken += 1;
    const localToken = requestToken;
    showLoading(feature.name);

    try {
      const data = await fetchFeatureDetails(feature);
      if (localToken !== requestToken) return;
      renderData(data);
    } catch (error) {
      if (localToken !== requestToken) return;
      renderError(feature.name, error);
    }
  }

  return { showFeature };
}

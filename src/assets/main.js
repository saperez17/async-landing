const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = '76d48019257b2d106ef2864ad9ce1ca6';

var configurationAPI;
const DEFAULT_SEARCH_OPTIONS = {
    include_adult: false,
    page: 1
}
const DEFAULT_COPY = {
    titleSearchPrimary: 'Busca tus',
    titleSearchSecondary: 'TV Shows favoritos',
    overview: ' Obten informacion actualizada de tus series de television favoritas, reviews, imagenes exlusivas, y mucho mas, con nuestro buscador online 100% gratuito',
}
const DEFAULT_IMGS = {
    searchMainImg: 'https://images.pexels.com/photos/7991259/pexels-photo-7991259.jpeg?auto=compress&cs=tinysrgb&w=1600'
}
var tvShowdata;


window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('form-search')
    form.addEventListener('submit', onSearchInputSubmit);
    const storedData = await fetch('https://saperez17.github.io/async-landing/assets/data.json');
    const storedDataJson = await storedData.json();
    tvShowdata = storedDataJson.tvShows;
    configurationAPI = storedDataJson.configuration
})


async function fetchData(path, options) {
    const response = await fetch(`${BASE_URL}${path}` + new URLSearchParams({
        api_key: API_KEY,
        ...options
    }), {
    })
    const data = await response.json();
    return data
}


const hideUIOnSuccessfullSearch = () => {
    const searchContainer = document.getElementById('search-container');
    searchContainer.classList.add('hidden');
}

const loadSearchDetailsUI = async ({ details, images, seasonDetails }) => {
    const titleSearchPrimary = document.getElementById('title-search-primary');
    const titleSearchSecondary = document.getElementById('title-search-secondary');
    const overview = document.getElementById('overview');
    const primaryImage = document.getElementById('search-main-img');
    const arrowGoBack = document.getElementsByClassName('arrow-go-back')[0];
    const carouselInner = document.getElementsByClassName('carousel-inner')[0];
    const imagesCarousel = document.getElementById('images-carousel');
    const landingImage = document.getElementById('landing-image');
    const seasonsContent = document.getElementById('seasons-content');
    const seasonsContentContainer = document.getElementById('seasons-content-container');

    const seasonThumbnailSize = configurationAPI.images.still_sizes[1];
    const promisesSeasonImages = [];
    for (let seasonDetail of seasonDetails.episodes) {
        promisesSeasonImages.push(fetchImages(seasonDetail.still_path, seasonThumbnailSize))
    }
    const seasonImages = await Promise.all(promisesSeasonImages);

    const imagesCarouselItemsHTML = `${images.map((image, idx) => `
        <div class="carousel-item ${idx === 0 && 'active'} relative float-left w-full">
            <img src="${image.url}" class="block w-full" alt="Wild Landscape" />
        </div>
    `).join('')}`

    const seasonItemsHTML = `${seasonDetails.episodes.map((details, idx) => `
    <div class="w-fit p-4 border-2 border-slate-100 rounded-lg ">
        <div class="whitespace-normal">
            <img 
                src="${seasonImages[idx].url}"
                alt="Image for chapter ${details.name}"
                height="127"
                width="227"
                class="mr-0 pr-0 rounded-lg">
            <p class="px-0 mx-0 pt-4 w-56 text-center text-base font-medium">${idx + 1} ${details.name} </p>
        </div>
        <div class="py-4">
            <p class=" text-sm font-light w-56">
            ${details.overview}
            </p>
        </div>
    </div>

`).join('')}`

    seasonsContentContainer.classList.remove('hidden')
    imagesCarousel.classList.remove('hidden');
    landingImage.classList.add('hidden');
    carouselInner.innerHTML = imagesCarouselItemsHTML;
    seasonsContent.innerHTML = seasonItemsHTML;
    titleSearchPrimary.textContent = details.name
    titleSearchSecondary.textContent = details.first_air_date.split('-')[0]
    overview.textContent = details.overview;
    arrowGoBack.classList.remove('hidden')
    hideUIOnSuccessfullSearch()
}

const restoreHomeUI = () => {
    const titleSearchPrimary = document.getElementById('title-search-primary');
    const titleSearchSecondary = document.getElementById('title-search-secondary');
    const overview = document.getElementById('overview');
    const primaryImage = document.getElementById('search-main-img');
    const arrowGoBack = document.getElementsByClassName('arrow-go-back')[0];
    const resultsList = document.getElementById('search-results-list');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('tv-search');
    const landingImage = document.getElementById('landing-image');
    const imagesCarousel = document.getElementById('images-carousel');
    const seasonsContent = document.getElementById('seasons-content');
    const seasonsContentContainer = document.getElementById('seasons-content-container');
    const loadingText = document.getElementById('loading-text');

    titleSearchPrimary.textContent = DEFAULT_COPY.titleSearchPrimary
    titleSearchSecondary.textContent = DEFAULT_COPY.titleSearchSecondary
    overview.textContent = DEFAULT_COPY.overview;
    primaryImage?.setAttribute('src', DEFAULT_IMGS.searchMainImg)
    arrowGoBack.classList.add('hidden')
    searchContainer.classList.remove('hidden');
    searchInput.value = ""
    // searchContainer.classList.a('invisible');
    resultsList.innerHTML = '';
    landingImage.classList.remove('hidden');
    imagesCarousel.classList.add('hidden');
    seasonsContentContainer.classList.add('hidden')
    seasonsContent.innerHTML = '';
    loadingText.textContent = '';
}

const fetchImages = async (imgId, imgSize) => {
    const urlPath = `${configurationAPI.images.base_url}${imgSize}${imgId}`
    const response = await fetch(urlPath, { api_key: API_KEY, });
    return response;
}

const search = (type, options) => {
    return fetchData(`/search\/${type}?`, { ...DEFAULT_SEARCH_OPTIONS, ...options });
}

const fetchDetails = async (id) => {
    const backdropImageSize = configurationAPI.images.backdrop_sizes[1];
    const loadingText = document.getElementById('loading-text');
    const resultsList = document.getElementById('search-results-list');

    loadingText.textContent = '¡No te vayas, tu TV show favorito esta en camino! 😍'
    resultsList.innerHTML = '';
    try {
        const details = await fetchData(`/tv\/${id}?`, {});
        const imagesData = await fetchData(`/tv\/${id}/images?`);

        const seasonDetails = await fetchData(`/tv\/${id}\/season\/${details.seasons?.[0].season_number}?`);
        const backdrops = imagesData.backdrops.slice(0, 3);
        const promisesBackdrops = [];
        for (let backdrop of backdrops) {
            promisesBackdrops.push(fetchImages(backdrop.file_path, backdropImageSize))
        }
        const backdropImages = await Promise.all(promisesBackdrops);
        await loadSearchDetailsUI({ details, images: backdropImages, seasonDetails })
    } catch (e) {
        console.log('e', e)
    }

}



const onSearchInputSubmit = async (e) => {
    e.preventDefault();
    const searchInput = document.getElementById('tv-search');
    const form = document.getElementById('form-search');
    const loadingText = document.getElementById('loading-text');
    const resultsList = document.getElementById('search-results-list');
    const queryParams = {
        query: searchInput.value,
    }

    loadingText.textContent = '...fui por tu info, ya vuelvo 🏃‍♂️';
    loadingText.classList.remove('invisible');
    try {
        const searchResults = await search('tv', queryParams);
        const listItems = `${searchResults.results.map((item) => `
        <li>
            <a
            class="text font-normal text-gray-600 text-xl hover:text-blue-500 hover:underline cursor-pointer"
            onclick="fetchDetails(${item.id})">
            ${item.name}
            </a> 
        </li>
        `).slice(0, 10).join('')}`
        resultsList.innerHTML = listItems;
        // loadingText.classList.toggle('invisible');
        loadingText.textContent = ""
    } catch (e) {
        throw new Error('Error: ' + e)
    }
}





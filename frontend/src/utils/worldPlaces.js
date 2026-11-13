import axios from 'axios';

const wikipediaApi = axios.create({
  baseURL: 'https://en.wikipedia.org/w/api.php',
  timeout: 15000,
});

const photonApi = axios.create({
  baseURL: 'https://photon.komoot.io/api',
  timeout: 10000,
});

const NON_PLACE_ARTICLE = /\b(?:commune|empire|rebellion|incident|siege|battle|timeline|archdiocese|diocese|federation|festival|election|tournament|association|station|railway|subway|railroad|airport|bus terminal|metro line)\b/i;

export async function searchWorldLocations(query, signal) {
  const { data } = await photonApi.get('/', {
    params: { q: query, limit: 6, lang: 'en' },
    signal,
  });

  return (data.features || [])
    .filter(feature => feature.geometry?.coordinates?.length === 2)
    .map(feature => {
      const properties = feature.properties || {};
      const label = [
        properties.name,
        properties.city,
        properties.state,
        properties.country,
      ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(', ');
      const [longitude, latitude] = feature.geometry.coordinates;

      return {
        id: `${properties.osm_type || 'place'}-${properties.osm_id || label}`,
        name: properties.name || properties.city || properties.locality || label,
        label,
        latitude,
        longitude,
      };
    })
    .filter(location => location.label);
}

export async function getNearbyWorldPlaces(location, signal) {
  const { latitude, longitude } = location;
  const { data } = await wikipediaApi.get('', {
    params: {
      action: 'query',
      generator: 'geosearch',
      ggscoord: `${latitude}|${longitude}`,
      ggsradius: 10000,
      ggslimit: 30,
      ggsorder: 'distance',
      prop: 'coordinates|pageimages|extracts',
      piprop: 'thumbnail',
      pithumbsize: 480,
      exintro: 1,
      explaintext: 1,
      format: 'json',
      origin: '*',
    },
    signal,
  });

  return Object.values(data.query?.pages || {})
    .filter(page => page.title && page.extract && page.coordinates?.[0] && !NON_PLACE_ARTICLE.test(page.title))
    .map(page => {
      const point = page.coordinates[0];
      const latitudeDelta = (point.lat - latitude) * Math.PI / 180;
      const longitudeDelta = (point.lon - longitude) * Math.PI / 180;
      const distance = 2 * 6371000 * Math.asin(Math.sqrt(
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(latitude * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
        Math.sin(longitudeDelta / 2) ** 2
      ));

      return {
        id: page.pageid,
        name: page.title,
        description: page.extract,
        image: page.thumbnail?.source,
        latitude: point.lat,
        longitude: point.lon,
        distance,
        articleUrl: `https://en.wikipedia.org/?curid=${page.pageid}`,
        mapUrl: `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=16/${point.lat}/${point.lon}`,
      };
    })
    .filter(place => place.name.toLowerCase() !== location.name.toLowerCase())
    .sort((first, second) => first.distance - second.distance)
    .map(({ distance, ...place }) => place);
}

import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: 41.9, lng: -93.1 },
  zoom:8
};

function loadPlaces(map, lat = 41.9, lng = -93.1) {
  axios.get(`/api/farms/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        console.log('no places found!');
        return;
      }
      // create a bounds
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.farmLocation.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // when someone clicks on a marker, show the details of that place
      markers.forEach(marker => marker.addListener('click', function() {
        const html = `
          <div class="popup">
            <a href="/farm/${this.place.farmSlug}">
              <img src="/uploads/${this.place.farmPhoto || 'farm.png'}" alt="${this.place.farmName}" />
              <p>${this.place.farmName} - ${this.place.farmLocation.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // then zoom the map to fit all the markers perfectly
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });

}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    console.log(place);
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng())
  });
}

export default makeMap;

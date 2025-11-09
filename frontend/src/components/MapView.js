// frontend/src/components/MapView.js
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function MapView({lat, lon}) {
  const center = [lat || 20.5937, lon || 78.9629]; // default India center
  return (
    <div style={{height:250}}>
      <MapContainer center={center} zoom={12} style={{height:"100%", width:"100%"}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center}>
          <Popup>Selected location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

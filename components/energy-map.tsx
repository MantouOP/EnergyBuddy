'use client';

import { useEffect } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

export type LocationPin = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type EnergyMapProps = {
  pins: LocationPin[];
  onAddPin: (lat: number, lng: number) => void;
  onRemovePin: (id: string) => void;
};

const energyPinIcon = divIcon({
  className: 'energy-map-pin',
  html: '<span aria-hidden="true"><i></i></span>',
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -38],
});

function MapClickHandler({ onAddPin }: Pick<EnergyMapProps, 'onAddPin'>) {
  useMapEvents({
    click(event) {
      onAddPin(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapViewport({ pins }: Pick<EnergyMapProps, 'pins'>) {
  const map = useMap();
  const newestPin = pins.at(-1);

  useEffect(() => {
    if (newestPin) map.flyTo([newestPin.lat, newestPin.lng], Math.max(map.getZoom(), 15));
  }, [map, newestPin]);

  return null;
}

export function EnergyMap({ pins, onAddPin, onRemovePin }: EnergyMapProps) {
  return (
    <MapContainer
      className="energy-map"
      center={[3.1209, 101.6538]}
      zoom={15}
      scrollWheelZoom
      aria-label="Interactive map for EnergyBuddy places"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onAddPin={onAddPin} />
      <MapViewport pins={pins} />
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={energyPinIcon}>
          <Popup>
            <div className="energy-popup">
              <strong>{pin.label}</strong>
              <span>{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>
              <button type="button" onClick={() => onRemovePin(pin.id)}>Remove pin</button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

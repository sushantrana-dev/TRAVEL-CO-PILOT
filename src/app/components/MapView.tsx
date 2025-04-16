'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// The actual Map component that loads Leaflet
const Map = () => {
  const [position] = useState<[number, number]>([28.7041, 77.1025]);
  
  // Only import these on client side
  useEffect(() => {
    // Import Leaflet CSS
    import('leaflet/dist/leaflet.css');
  }, []);

  // Dynamic imports to prevent SSR issues
  const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
  );
  
  const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
  );
  
  const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
  );

  // Fix Leaflet icon issues
  useEffect(() => {
    // Initialize Leaflet on client side only
    const initializeLeaflet = async () => {
      try {
        const L = await import('leaflet');
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
          iconUrl: require('leaflet/dist/images/marker-icon.png'),
          shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        });
      } catch (error) {
        console.error('Error initializing Leaflet:', error);
      }
    };

    initializeLeaflet();
  }, []);

  return (
    <div style={{ height: '50vh', width: '100%', marginBottom: '30px' }}>
      <MapContainer 
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
};

// Export using a wrapper to ensure it only renders on client
export default function MapView() {
  return <Map />;
}
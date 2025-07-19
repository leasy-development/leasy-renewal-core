import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Types for Google Maps without the external library
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

interface GoogleMapsLoaderResult {
  isLoaded: boolean;
  loadError: Error | undefined;
}

interface AddressData {
  street_number: string;
  street_name: string;
  city: string;
  zip_code: string;
  region: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface Props {
  onAddressSelect: (address: AddressData) => void;
  initialAddress?: Partial<AddressData>;
  apiKey: string;
}

// Simple Google Maps loader hook
const useGoogleMapsLoader = (apiKey: string): GoogleMapsLoaderResult => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!apiKey) return;

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initMap;
    };
  }, [apiKey]);

  return { isLoaded, loadError };
};

const AddressAutocomplete = ({ onAddressSelect, initialAddress, apiKey }: Props) => {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 52.5200, lng: 13.4050 }); // Berlin default
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useGoogleMapsLoader(apiKey);

  useEffect(() => {
    if (initialAddress?.street_name && initialAddress?.city) {
      const fullAddress = `${initialAddress.street_number || ''} ${initialAddress.street_name}, ${initialAddress.city}, ${initialAddress.country || 'Germany'}`.trim();
      setAddress(fullAddress);
    }
  }, [initialAddress]);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current && window.google) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: ['de', 'at', 'ch', 'nl'] },
        fields: ['address_components', 'formatted_address', 'geometry']
      });

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (isLoaded && coordinates && mapRef.current && !map && window.google) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 16,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      });

      const newMarker = new window.google.maps.Marker({
        position: coordinates,
        map: newMap,
        draggable: true
      });

      newMarker.addListener('dragend', (e: any) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        handleMarkerDragEnd(newLat, newLng);
      });

      setMap(newMap);
      setMarker(newMarker);
    }
  }, [isLoaded, coordinates]);

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place.address_components || !place.geometry?.location) return;

    const addressData: AddressData = {
      street_number: '',
      street_name: '',
      city: '',
      zip_code: '',
      region: '',
      country: 'Germany',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    place.address_components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.street_number = component.long_name;
      } else if (types.includes('route')) {
        addressData.street_name = component.long_name;
      } else if (types.includes('locality')) {
        addressData.city = component.long_name;
      } else if (types.includes('postal_code')) {
        addressData.zip_code = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.region = component.long_name;
      } else if (types.includes('country')) {
        addressData.country = component.long_name;
      }
    });

    setAddress(place.formatted_address || '');
    setCoordinates({ lat: addressData.lat!, lng: addressData.lng! });
    setMapCenter({ lat: addressData.lat!, lng: addressData.lng! });
    setShowMap(true);
    onAddressSelect(addressData);
  };

  const handleMarkerDragEnd = (newLat: number, newLng: number) => {
    setCoordinates({ lat: newLat, lng: newLng });
    
    // Update marker position
    if (marker) {
      marker.setPosition({ lat: newLat, lng: newLng });
    }
    
    // Reverse geocode to get updated address
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results?.[0]) {
          const result = results[0];
          setAddress(result.formatted_address);
          
          const addressData: AddressData = {
            street_number: '',
            street_name: '',
            city: '',
            zip_code: '',
            region: '',
            country: 'Germany',
            lat: newLat,
            lng: newLng
          };

          result.address_components?.forEach((component: any) => {
            const types = component.types;

            if (types.includes('street_number')) {
              addressData.street_number = component.long_name;
            } else if (types.includes('route')) {
              addressData.street_name = component.long_name;
            } else if (types.includes('locality')) {
              addressData.city = component.long_name;
            } else if (types.includes('postal_code')) {
              addressData.zip_code = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              addressData.region = component.long_name;
            } else if (types.includes('country')) {
              addressData.country = component.long_name;
            }
          });

          onAddressSelect(addressData);
        }
      });
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="text-destructive">
          Error loading Google Maps. Please check your API key and try again.
        </div>
        <Input
          ref={inputRef}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter full address manually"
        />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="address-autocomplete">
          <MapPin className="inline h-4 w-4 mr-1" />
          Address
        </Label>
        <Input
          ref={inputRef}
          id="address-autocomplete"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Start typing your address..."
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Start typing to search for your address. Select from the dropdown for accurate coordinates.
        </p>
      </div>

      {showMap && coordinates && (
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden">
            <div 
              ref={mapRef}
              style={{ width: '100%', height: '300px' }}
              className="bg-muted/20"
            />
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">📍 Is this pin location correct?</p>
            <p className="text-sm text-muted-foreground">
              The pin can be moved by dragging it on the map to adjust the exact location.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
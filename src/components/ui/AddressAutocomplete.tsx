import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressResult {
  formattedAddress: string;
  streetNumber?: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: string) => void;
  onSelect?: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Start typing an address...',
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize services
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || typeof google === 'undefined') return;

    autocompleteService.current = new google.maps.places.AutocompleteService();
    
    // Create a dummy div for PlacesService
    const dummyDiv = document.createElement('div');
    placesService.current = new google.maps.places.PlacesService(dummyDiv);
  }, []);

  // Handle input changes
  useEffect(() => {
    if (!inputValue || inputValue.length < 3 || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        autocompleteService.current?.getPlacePredictions(
          {
            input: inputValue,
            componentRestrictions: { country: 'nz' },
            types: ['address'],
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results);
              setIsOpen(true);
            } else {
              setPredictions([]);
            }
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Autocomplete error:', err);
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(debounce);
  }, [inputValue]);

  // Handle selection
  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'address_components'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const components = place.address_components || [];
          const getComponent = (type: string) =>
            components.find((c) => c.types.includes(type))?.long_name;

          const result: AddressResult = {
            formattedAddress: place.formatted_address || prediction.description,
            streetNumber: getComponent('street_number'),
            streetName: getComponent('route'),
            suburb: getComponent('sublocality') || getComponent('locality'),
            city: getComponent('administrative_area_level_1'),
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          };

          setInputValue(result.formattedAddress);
          onChange?.(result.formattedAddress);
          onSelect?.(result);
          setIsOpen(false);
          setPredictions([]);
        }
      }
    );
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange?.(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange?.(e.target.value);
          }}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{prediction.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

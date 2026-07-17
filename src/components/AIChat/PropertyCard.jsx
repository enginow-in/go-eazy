import { MapPin, Wifi, ParkingCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PropertyCard = ({ property, index }) => {
  const navigate = useNavigate();
  
  const handleViewProperty = () => {
    navigate(`/property/${property.id}`);
  };

  const getAmenityIcon = (amenity) => {
    const amenityLower = String(amenity).toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi size={16} />;
    if (amenityLower.includes('parking')) return <ParkingCircle size={16} />;
    if (amenityLower.includes('security') || amenityLower.includes('cctv')) return <Shield size={16} />;
    return null;
  };

  const displayAmenities = (property.amenities || []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100"
    >
      {/* Image */}
      <div className="w-full h-32 bg-gray-200 overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
          {property.title}
        </h3>

        {/* Price */}
        <div className="mb-2">
          <p className="text-lg font-bold text-[#CA3433]">
            ₹{Number(property.price).toLocaleString()}
          </p>
          {property.type && (
            <p className="text-xs text-gray-600 capitalize">{property.type}</p>
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-1 mb-2 text-xs text-gray-600">
          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
          <span className="line-clamp-1">
            {property.area || property.city || 'Location not specified'}
          </span>
        </div>

        {/* Details Grid */}
        {(property.bedrooms || property.area) && (
          <div className="flex gap-2 mb-2 text-xs text-gray-600">
            {property.bedrooms && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {property.bedrooms} BHK
              </span>
            )}
            {property.area && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {property.area}
              </span>
            )}
          </div>
        )}

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {displayAmenities.map((amenity, idx) => (
              <div
                key={idx}
                className="text-gray-500 bg-gray-50 p-1.5 rounded-full flex items-center justify-center"
                title={String(amenity)}
              >
                {getAmenityIcon(amenity) || (
                  <span className="text-xs">{String(amenity).charAt(0)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View Button */}
        <button
          onClick={handleViewProperty}
          className="w-full bg-[#CA3433] hover:bg-[#b42d2c] text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          View Property
        </button>
      </div>
    </motion.div>
  );
};

export default PropertyCard;

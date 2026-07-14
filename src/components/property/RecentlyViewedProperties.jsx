import { useEffect, useState } from 'react';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { useProperties } from '../../hooks/useProperties';
import PropertyCard from './PropertyCard';
import Skeleton from '../ui/Skeleton';

function RecentlyViewedProperties({ title = 'Recently Viewed Properties' }) {
  const { recentlyViewed } = useRecentlyViewed();
  const { fetchPropertiesByIds } = useProperties();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recentlyViewed || recentlyViewed.length === 0) {
      setProperties([]);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    fetchPropertiesByIds(recentlyViewed)
      .then((data) => {
        if (!isCancelled && data) {
          // Maintain order: most recent first
          const byId = new Map(data.map((p) => [p.id, p]));
          const ordered = recentlyViewed
            .map((id) => byId.get(id))
            .filter(Boolean);
          setProperties(ordered);
        }
      })
      .catch((err) => {
        console.error('Error loading recently viewed:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [recentlyViewed, fetchPropertiesByIds]);

  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed-section" style={{ margin: '2rem 0' }}>
      <div className="recently-viewed-header">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>
          {title}
        </h2>
      </div>

      {loading ? (
        <div 
          className="recently-viewed-list" 
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : (
        <div 
          className="recently-viewed-list" 
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}
        >
          {properties.length > 0 ? (
            properties.slice(0, 8).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
          ) : (
            <p style={{ color: '#666' }}>No recently viewed properties available.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default RecentlyViewedProperties;
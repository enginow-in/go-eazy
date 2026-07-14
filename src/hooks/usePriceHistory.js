import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to fetch and manage price history for a property
 * @param {string} propertyId - UUID of the property
 * @returns {object} { history, loading, error, refetch }
 */
export const usePriceHistory = (propertyId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch price history from Supabase
  const fetchPriceHistory = async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('price_history')
        .select('*')
        .eq('property_id', propertyId)
        .order('changed_at', { ascending: false });

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError(err.message || 'Failed to load price history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, [propertyId]);

  // Allow manual refetch
  const refetch = () => {
    fetchPriceHistory();
  };

  return {
    history,
    loading,
    error,
    refetch
  };
};
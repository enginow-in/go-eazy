import React from 'react';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import './PriceHistoryTimeline.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const PriceHistoryTimeline = ({ propertyId }) => {
  const { history, loading, error } = usePriceHistory(propertyId);

  if (loading) {
    return (
      <section className="price-history-section" aria-labelledby="price-history-heading">
        <h2 id="price-history-heading" className="price-history-title">
          Price History
        </h2>
        <div className="price-history-loading">
          <div className="spinner"></div>
          <p>Loading price history...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="price-history-section" aria-labelledby="price-history-heading">
        <h2 id="price-history-heading" className="price-history-title">
          Price History
        </h2>
        <div className="price-history-error">
          <p>⚠️ Unable to load price history</p>
        </div>
      </section>
    );
  }

  if (!history || history.length === 0) {
    return (
      <section className="price-history-section" aria-labelledby="price-history-heading">
        <h2 id="price-history-heading" className="price-history-title">
          Price History
        </h2>
        <div className="price-history-empty">
          <p>📊 No price changes yet</p>
          <small>This property has maintained its original price</small>
        </div>
      </section>
    );
  }

  return (
    <section className="price-history-section" aria-labelledby="price-history-heading">
      <h2 id="price-history-heading" className="price-history-title">
        📊 Price History
      </h2>

      <div className="price-timeline">
        {history.map((item, index) => {
          const priceDiff = Number(item.new_price) - Number(item.old_price);
          const percentChange = ((priceDiff / Number(item.old_price)) * 100).toFixed(1);
          const isDecrease = priceDiff < 0;
          const isIncrease = priceDiff > 0;

          return (
            <div key={item.id} className="timeline-item">
              <div className="timeline-marker">
                <span className={`marker-dot ${isDecrease ? 'decrease' : isIncrease ? 'increase' : 'neutral'}`}></span>
                {index < history.length - 1 && <span className="marker-line"></span>}
              </div>

              <div className="timeline-content">
                <div className="price-change-card">
                  <div className="price-row">
                    <span className="old-price">{formatPrice(item.old_price)}</span>
                    <span className="arrow" aria-hidden="true">
                      {isDecrease ? '↓' : isIncrease ? '↑' : '→'}
                    </span>
                    <span className={`new-price ${isDecrease ? 'price-drop' : isIncrease ? 'price-rise' : ''}`}>
                      {formatPrice(item.new_price)}
                    </span>
                  </div>

                  {priceDiff !== 0 && (
                    <div className={`price-badge ${isDecrease ? 'badge-drop' : 'badge-rise'}`}>
                      {isDecrease ? '-' : '+'}{formatPrice(Math.abs(priceDiff))}
                      <span className="percentage">({isDecrease ? '' : '+'}{percentChange}%)</span>
                    </div>
                  )}

                  <div className="change-date">
                    {formatDate(item.changed_at)}
                  </div>

                  <span className="sr-only">
                    Price changed from {formatPrice(item.old_price)} to {formatPrice(item.new_price)} 
                    on {formatDate(item.changed_at)}, 
                    {isDecrease ? `decreased by ${percentChange}%` : isIncrease ? `increased by ${percentChange}%` : 'no change'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="price-history-footer">
        <small>💡 Showing all historical price changes</small>
      </div>
    </section>
  );
};

export default PriceHistoryTimeline;
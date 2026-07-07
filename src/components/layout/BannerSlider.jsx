import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Skeleton } from '../ui/Skeleton';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const desktopBanners = [
  'https://ik.imagekit.io/goeazy/BANNER%201st.webp',
  'https://ik.imagekit.io/goeazy/BANNER%202nd.webp',
  'https://ik.imagekit.io/goeazy/BANNER%203rd.webp'
];

export const BannerSlider = () => {
  const banners = desktopBanners;
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="w-full bg-slate-50 px-1 sm:px-2 py-2 sm:py-3">
      <div className="w-full overflow-hidden rounded-lg sm:rounded-xl shadow-sm relative">
        {!isLoaded && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full aspect-[21/9] sm:aspect-[21/7] rounded-none" />
          </div>
        )}
        
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop={true}
          className="w-full"
          onSwiper={() => {
            // Preload the first image manually to ensure isLoaded triggers correctly
            const img = new Image();
            img.src = banners[0];
            img.onload = () => setIsLoaded(true);
            img.onerror = () => setIsLoaded(true);
          }}
        >
          {banners.map((src, index) => (
            <SwiperSlide key={index}>
              <div className="w-full flex items-center justify-center">
                <img 
                  src={src} 
                  alt={`GoEazy Banner ${index + 1}`} 
                  className="w-full h-auto block transition-opacity duration-500"
                  loading={index === 0 ? "eager" : "lazy"}
                  onLoad={index === 0 ? () => setIsLoaded(true) : undefined}
                  onError={index === 0 ? () => setIsLoaded(true) : undefined}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

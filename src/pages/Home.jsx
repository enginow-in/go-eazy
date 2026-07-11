import React from 'react'
import { Home as HomeIcon, Building, Tent } from 'lucide-react'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { FeaturedSection, PropertySection } from '../components/home/PropertySection'

export const Home = () => {
  return (
    <div className="bg-white">
      
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16">
          <HeroCarousel />
        </div>
        <FeaturedSection />
        <PropertySection title="Premium Rooms" type="Room" icon={<HomeIcon className="text-brand-500" />} />
        <PropertySection title="Spacious Flats" type="Flat" icon={<Building className="text-brand-500" />} />
        <PropertySection title="Affordable PGs" type="PG" icon={<Tent className="text-brand-500" />} />
      </div>
    </div>
  )
}

import React from 'react'
import { Home as HomeIcon, Building, Tent, Shield, Users, Star, Clock, MapPin, Wifi, Car, Utensils, Camera } from 'lucide-react'
import { Hero } from '../components/home/Hero'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { FeaturedSection, PropertySection } from '../components/home/PropertySection'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setFilters } from '../store/propertySlice'
import { Button } from '../components/ui/Button'

export const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const features = [
    {
      icon: <Shield size={24} className="text-blue-600" />,
      title: "100% Verified Properties",
      description: "Every listing is personally verified by our team for authenticity and quality"
    },
    {
      icon: <Users size={24} className="text-green-600" />,
      title: "Direct Owner Contact",
      description: "Skip brokers and connect directly with property owners for transparent deals"
    },
    {
      icon: <Star size={24} className="text-yellow-600" />,
      title: "Premium Quality",
      description: "Curated selection of high-quality PGs, rooms, and flats in prime locations"
    },
    {
      icon: <Clock size={24} className="text-purple-600" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you find your perfect home"
    }
  ]

  const amenities = [
    { icon: <Wifi size={20} />, name: "High-Speed WiFi" },
    { icon: <Car size={20} />, name: "Parking Space" },
    { icon: <Utensils size={20} />, name: "Food Available" },
    { icon: <Camera size={20} />, name: "CCTV Security" },
    { icon: <Shield size={20} />, name: "24/7 Security" },
    { icon: <MapPin size={20} />, name: "Prime Locations" }
  ]

  const cities = [
    { name: "Dehradun", properties: "1,200+", image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=400&q=80" },
    { name: "Srinagar", properties: "800+", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
    { name: "Rishikesh", properties: "600+", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80" },
    { name: "Nainital", properties: "500+", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80" }
  ]

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Engineering Student",
      text: "Found my perfect PG in just 2 days! The verification process gave me confidence, and direct owner contact saved me from broker hassles.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
    },
    {
      name: "Rohit Kumar",
      role: "Software Professional",
      text: "GoEazy made finding a flat in Dehradun so easy. Premium quality listings and transparent pricing - exactly what I needed!",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit"
    },
    {
      name: "Ananya Gupta",
      role: "Medical Student",
      text: "The 24/7 support team helped me find accommodation before my college started. Highly recommended for all students!",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya"
    }
  ]

  return (
    <div className="bg-white">
      <Hero />
      
      {/* Hero Carousel */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16">
          <HeroCarousel />
        </div>
        
        {/* Why Choose GoEazy Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-[#CA3433]">GoEazy</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're not just another property platform. We're your trusted partner in finding the perfect home away from home.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Cities Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Cities in <span className="text-[#CA3433]">Uttarakhand</span>
            </h2>
            <p className="text-lg text-gray-600">
              Discover premium accommodations in Uttarakhand's most sought-after cities
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cities.map((city, index) => (
              <div 
                key={index} 
                className="relative overflow-hidden rounded-2xl group cursor-pointer"
                onClick={() => {
                  dispatch(setFilters({ city: city.name }))
                  navigate('/search')
                }}
              >
                <div className="aspect-[4/3] relative">
                  <img 
                    src={city.image} 
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{city.name}</h3>
                  <p className="text-sm opacity-90">{city.properties} properties</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Amenities Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Premium <span className="text-[#CA3433]">Amenities</span>
            </h2>
            <p className="text-lg text-gray-600">
              Modern facilities and services that make your stay comfortable and convenient
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-[#fff5f5] hover:text-[#CA3433] transition-all duration-300 group">
                <div className="w-12 h-12 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {amenity.icon}
                </div>
                <span className="text-sm font-semibold text-center">{amenity.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Property Sections */}
        <FeaturedSection />
        <PropertySection title="Premium Rooms" type="Room" icon={<HomeIcon className="text-brand-500" />} />
        <PropertySection title="Spacious Flats" type="Flat" icon={<Building className="text-brand-500" />} />
        <PropertySection title="Affordable PGs" type="PG" icon={<Tent className="text-brand-500" />} />

        {/* Customer Testimonials */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our <span className="text-[#CA3433]">Students</span> Say
            </h2>
            <p className="text-lg text-gray-600">
              Real experiences from students and professionals who found their perfect home with GoEazy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center py-16 px-6 bg-gradient-to-br from-[#CA3433] to-[#E63946] rounded-3xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Perfect Home?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of students and professionals who have found their ideal accommodation through GoEazy. 
            Start your search today and experience hassle-free property hunting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-[#CA3433] hover:bg-gray-100 px-8 py-3 rounded-xl font-bold"
              onClick={() => navigate('/search')}
            >
              Browse Properties
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="border-2 border-white text-white hover:bg-white hover:text-[#CA3433] px-8 py-3 rounded-xl font-bold"
              onClick={() => navigate('/landlord')}
            >
              List Your Property
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

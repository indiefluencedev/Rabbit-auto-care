import { redirect } from 'next/navigation'
import HeroSection from '@/components/home/HeroSection'
import CategoriesSection from '@/components/home/CategoriesSection'
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection'
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection'
import NewsletterSection from '@/components/home/NewsletterSection'
import ThemeColorsDisplay from '@/components/ThemeColorsDisplay'

export default function Home() {
  return (
    <main>
      <ThemeColorsDisplay />
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductsSection />
      <WhyChooseUsSection />
      <NewsletterSection />
    </main>
  )
}

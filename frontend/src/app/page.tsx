import {
  organizationSchema,
  websiteSchemaWithSearchAction,
  webApplicationSchema,
} from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/static/json-ld';
import { HeroSection } from '@/features/home/hero-section';
import { BestInCategory } from '@/features/home/best-in-category';
import { HowItWorks } from '@/features/home/how-it-works';
import { ProtectionLayers } from '@/features/home/protection-layers';
import { WriteReviewCTA } from '@/features/home/write-review-cta';
import {
  AudienceJourney,
  AudienceFeatureGrid,
} from '@/features/home/audience-journey';
import { CertifiedHowItWorks } from '@/features/home/certified-how-it-works';
import { TrendingReviewsMarquee } from '@/features/home/trending-reviews-marquee';
import { AwardsShowcase } from '@/features/home/awards-showcase';
import { BrandsLove } from '@/features/home/brands-love';
import { StatsStripClient } from '@/features/home/stats-strip-client';

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchemaWithSearchAction(),
          webApplicationSchema(),
        ]}
      />

      <HeroSection />

      <BestInCategory />

      <HowItWorks />

      <section className="border-y border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container-wide py-10 md:py-14">
          <StatsStripClient />
        </div>
      </section>

      <ProtectionLayers />

      <TrendingReviewsMarquee />

      <CertifiedHowItWorks />

      <WriteReviewCTA variant="public" />

      <AwardsShowcase />

      <BrandsLove />
    </>
  );
}

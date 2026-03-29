import { getHomepageData } from "@/lib/queries";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const { featuredOperations, stats } = await getHomepageData();

  return (
    <>
      <HeroSection locale={locale} />
      <StatsBar stats={stats} />
      <FeaturedGrid operations={featuredOperations} locale={locale} />
    </>
  );
}

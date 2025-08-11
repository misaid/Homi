import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import FAQ from "@/components/marketing/FAQ";
import Features from "@/components/marketing/Features";
import Footer from "@/components/marketing/Footer";
import Hero from "@/components/marketing/Hero";
import Logos from "@/components/marketing/Logos";
import NavBar from "@/components/marketing/NavBar";
import Pricing from "@/components/marketing/Pricing";
import Screenshot from "@/components/marketing/Screenshot";

export default function MarketingIndex() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [anchors, setAnchors] = useState<{ [key: string]: number }>({});

  function setAnchor(name: string, y: number) {
    setAnchors((prev) => ({ ...prev, [name]: y }));
  }

  function scrollTo(name: "pricing" | "faq") {
    const y = anchors[name];
    if (typeof y === "number") {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.page}
      contentContainerStyle={styles.container}
    >
      <NavBar
        onGoToPricing={() => scrollTo("pricing")}
        onGoToFAQ={() => scrollTo("faq")}
      />
      <Hero />
      <Logos />
      <Features />
      <Screenshot />
      <View onLayout={(e) => setAnchor("pricing", e.nativeEvent.layout.y)}>
        <Pricing />
      </View>
      <View onLayout={(e) => setAnchor("faq", e.nativeEvent.layout.y)}>
        <FAQ />
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#ffffff" },
  container: { paddingBottom: 48 },
});

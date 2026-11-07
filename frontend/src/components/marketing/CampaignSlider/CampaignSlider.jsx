import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { getPublicCampaigns } from "../../../services/publicCampaignService";
import CampaignCard from "../CampaignCard/CampaignCard";

export default function CampaignSlider() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicCampaigns();
        setCampaigns(Array.isArray(data) ? data : data?.campaigns || []);
      } catch (error) {
        console.error(error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box py={8} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Box py={8} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          No active campaigns available.
        </Typography>
      </Box>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={30}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
      loop={campaigns.length > 3}
      breakpoints={{
        0: { slidesPerView: 1 },
        600: { slidesPerView: 2 },
        900: { slidesPerView: 3 },
      }}
    >
      {campaigns.map((campaign) => (
        <SwiperSlide key={campaign.id}>
          <CampaignCard campaign={campaign} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useJourney } from "@/contexts/JourneyContext";

const Stop2NameMeaning = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname } = useJourney();

  useEffect(() => {
    if (unknownSurname) {
      navigate("/journey/1", { replace: true });
    } else if (!surname) {
      // User landed here without starting a journey (direct URL nav);
      // send them to Stop 1 so they enter a surname first.
      navigate("/journey/1", { replace: true });
    }
  }, [unknownSurname, surname, navigate]);

  return null;
};

export default Stop2NameMeaning;

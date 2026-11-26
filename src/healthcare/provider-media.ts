import type { ImageSourcePropType } from "react-native";

export type ProviderMedia = {
  image: ImageSourcePropType;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export const providerMedia: Readonly<Record<string, ProviderMedia>> = {
  "acibadem-altunizade": {
    image: require("../../assets/providers/acibadem-altunizade.jpg"),
    alt: "Exterior of Acibadem Altunizade Hospital in Istanbul",
    credit: "CeeGee",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Ac%C4%B1bademHospitalAltunizade_(2).jpg",
  },
  "bumrungrad-international-hospital": {
    image: require("../../assets/providers/bumrungrad-campus.jpg"),
    alt: "Entrance building of Bumrungrad International Hospital in Bangkok",
    credit: "Teesal",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Thailand_Bangkok_Bumrungrad_International_Hospital_entrance-building.jpg",
  },
  "severance-hospital": {
    image: require("../../assets/providers/severance-hospital.jpg"),
    alt: "Exterior of Severance Hospital in Seoul",
    credit: "Integral",
    license: "CC BY-SA 2.0 KR",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Severance_Hospital.jpg",
  },
  "hospital-cima": {
    image: require("../../assets/providers/hospital-cima.jpg"),
    alt: "Exterior of Hospital CIMA in Escazú, Costa Rica",
    credit: "Rodtico21",
    license: "CC BY-SA 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Hospital_CIMA._Escaz%C3%BA._Costa_Rica.JPG",
  },
};

import type { Catalog } from "./types";
import { categories, countries, treatments } from "./catalog-data";
import { providersEast, offeringsEast } from "./providers-east";
import { providersWest, offeringsWest } from "./providers-west";
import {
  offeringsDiscovery,
  providersDiscovery,
} from "./providers-discovery";
import { guides } from "./guides";

export const seedCatalog: Catalog = {
  categories,
  countries,
  treatments,
  providers: [...providersEast, ...providersWest, ...providersDiscovery],
  offerings: [...offeringsEast, ...offeringsWest, ...offeringsDiscovery],
  guides,
};

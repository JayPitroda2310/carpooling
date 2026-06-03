import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SearchBar } from "../components/SearchBar";
import { RideCard } from "../components/RideCard";
import { Ride } from "../data/mockData";
import { searchRides } from "../data/rides";
import { SlidersHorizontal } from "lucide-react";

/** Parse "09:00 AM" / "06:00 PM" → 24h hour (0–23). */
function hourOf(time: string): number {
  const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1], 10) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return h;
}

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const passengers = Number(searchParams.get("passengers") || "0");

  const [results, setResults] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  // sidebar filter state
  const [departure, setDeparture] = useState("any");
  const [priceRange, setPriceRange] = useState("any");
  const [seatsMin, setSeatsMin] = useState(0);
  const [petsOnly, setPetsOnly] = useState(false);
  const [nonSmoking, setNonSmoking] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchRides({ from, to, date, minSeats: passengers })
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [from, to, date, passengers]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      // price range (₹)
      if (priceRange === "under500" && r.price >= 500) return false;
      if (priceRange === "500-1000" && (r.price < 500 || r.price > 1000)) return false;
      if (priceRange === "1000plus" && r.price < 1000) return false;
      // seats available
      if (seatsMin && r.seats < seatsMin) return false;
      // departure window
      if (departure !== "any") {
        const h = hourOf(r.time);
        if (departure === "morning" && !(h >= 6 && h < 12)) return false;
        if (departure === "afternoon" && !(h >= 12 && h < 18)) return false;
        if (departure === "evening" && !(h >= 18 && h < 24)) return false;
      }
      // preferences
      if (petsOnly && !r.preferences.includes("Pets OK")) return false;
      if (nonSmoking && !r.preferences.includes("No Smoking")) return false;
      return true;
    });
  }, [results, priceRange, seatsMin, departure, petsOnly, nonSmoking]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Search Bar */}
      <div className="bg-card border-b py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar variant="compact" />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 space-y-6">
            <div className="bg-card border border-primary rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-5 h-5" />
                <h2 className="font-semibold">Filters</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Departure Time</label>
                  <select
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="any">Any time</option>
                    <option value="morning">Morning (6-12)</option>
                    <option value="afternoon">Afternoon (12-18)</option>
                    <option value="evening">Evening (18-24)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Price Range</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="any">Any price</option>
                    <option value="under500">Under ₹500</option>
                    <option value="500-1000">₹500 – ₹1000</option>
                    <option value="1000plus">₹1000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Seats Available</label>
                  <select
                    value={seatsMin}
                    onChange={(e) => setSeatsMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={0}>Any</option>
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                  </select>
                </div>

                <div className="pt-4 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={petsOnly}
                      onChange={(e) => setPetsOnly(e.target.checked)}
                    />
                    <span className="text-sm">Pets Allowed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={nonSmoking}
                      onChange={(e) => setNonSmoking(e.target.checked)}
                    />
                    <span className="text-sm">Non-Smoking</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {from && to ? `${from} → ${to}` : "All Available Rides"}
              </h1>
              <p className="text-muted-foreground">
                {loading
                  ? "Searching…"
                  : `${filtered.length} ${filtered.length === 1 ? "ride" : "rides"} found`}
              </p>
            </div>

            {loading && (
              <div className="bg-card border border-primary rounded-lg p-12 text-center text-muted-foreground">
                Loading rides…
              </div>
            )}

            {!loading && (
              <div className="space-y-4">
                {filtered.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="bg-card border border-primary rounded-lg p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No rides found for your search criteria
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search dates
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

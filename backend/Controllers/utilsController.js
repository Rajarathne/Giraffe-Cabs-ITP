const axios = require('axios');

// Helper: geocode address to { lat, lon }
async function geocodeAddress(address) {
  const url = 'https://nominatim.openstreetmap.org/search';
  const params = { q: address, format: 'json', limit: 1 };
  const headers = { 'User-Agent': 'Giraffe-Cabs/1.0 (distance-calc)' };
  const { data } = await axios.get(url, { params, headers });
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Location not found');
  }
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// GET /api/utils/distance?pickup=...&dropoff=...
exports.getDistance = async (req, res) => {
  try {
    const pickup = (req.query.pickup || '').trim();
    const dropoff = (req.query.dropoff || '').trim();
    if (!pickup || !dropoff) {
      return res.status(400).json({ message: 'pickup and dropoff are required' });
    }

    const [from, to] = await Promise.all([
      geocodeAddress(pickup),
      geocodeAddress(dropoff)
    ]);

    const routeUrl = `http://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}`;
    const { data: routeData } = await axios.get(routeUrl, { params: { overview: 'false' } });
    const route = routeData && routeData.routes && routeData.routes[0];
    if (!route) {
      return res.status(502).json({ message: 'Route not found' });
    }
    const distanceKm = Math.round((route.distance / 1000) * 100) / 100; // 2 decimals

    return res.json({
      pickup,
      dropoff,
      coordinates: { from, to },
      distanceKm
    });
  } catch (err) {
    console.error('Distance calculation error:', err.message);
    return res.status(500).json({ message: 'Failed to calculate distance' });
  }
};



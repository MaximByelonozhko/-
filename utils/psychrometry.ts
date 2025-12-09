/**
 * Calculates saturation vapor pressure (es) in hPa using Magnus formula.
 * @param temp Temperature in Celsius
 */
const getSaturationVaporPressure = (temp: number): number => {
  return 6.112 * Math.exp((17.67 * temp) / (temp + 243.5));
};

/**
 * Calculates Relative Humidity using the Sprung formula for psychrometers.
 * 
 * Formula approximation:
 * e = e'_w - A * p * (t_dry - t_wet)
 * RH = (e / e_dry) * 100
 * 
 * Where:
 * e = actual vapor pressure
 * e'_w = saturation vapor pressure at wet bulb temp
 * A = psychrometer constant (0.0007947 for natural draft/screened, 0.000662 for aspirated/Assmann)
 * We will use an average/standard value for typical wall-mounted hygrometers (approx 0.0008).
 * p = atmospheric pressure (using standard 1013.25 hPa)
 */
export const calculateHumidity = (dryTemp: number, wetTemp: number): number => {
  // Sanity check
  if (wetTemp > dryTemp) {
    // Physically impossible for standard evaporation unless supersaturated or error, 
    // but usually user error or sensor error. We clamp wet to dry for calc.
    // However, let's return a value based on input to show the user the weirdness.
    // Or just clamp it.
    // wetTemp = dryTemp; 
  }

  const p = 1013.25; // Standard atmospheric pressure in hPa
  const A = 0.0007947; // Coefficient for typical unventilated psychrometer (VIT-1/VIT-2 style)

  const esWet = getSaturationVaporPressure(wetTemp);
  const esDry = getSaturationVaporPressure(dryTemp);

  // Partial vapor pressure
  const e = esWet - A * p * (dryTemp - wetTemp);

  let rh = (e / esDry) * 100;

  // Clamp results between 0 and 100
  rh = Math.max(0, Math.min(100, rh));

  return parseFloat(rh.toFixed(1));
};

export const calculateDewPoint = (temp: number, rh: number): number => {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(rh / 100.0);
  return (b * alpha) / (a - alpha);
};
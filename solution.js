const TOTAL_CHARGEPOINTS = 20;
const CHARGE_RATE_KW = 11; // Charging rate of 11 kW per chargepoint
const INTERVALS_PER_HOUR = 4; // 15-minute intervals per hour
const TOTAL_INTERVALS = 365 * 24 * INTERVALS_PER_HOUR; // Total 15-minute intervals in a year

const hourlyArrivalProbabilities = [
    0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, // 00:00 - 08:00
    0.0283, 0.0283, 0.0566, 0.0566, 0.0566, 0.0755, 0.0755, 0.0755, // 08:00 - 16:00
    0.1038, 0.1038, 0.1038, 0.0472, 0.0472, 0.0472, 0.0094, 0.0094  // 16:00 - 24:00
  ];
  
  // Adjust probabilities for 15-minute intervals (divide by 4)
  const intervalArrivalProbabilities = hourlyArrivalProbabilities.map(p => p / INTERVALS_PER_HOUR);
  
  // Charging demand probabilities
  const chargingDemandProbabilities = [
    { prob: 34.31, km: 0 },
    { prob: 4.90, km: 5 },
    { prob: 9.80, km: 10 },
    { prob: 11.76, km: 20 },
    { prob: 8.82, km: 30 },
    { prob: 11.76, km: 50 },
    { prob: 10.78, km: 100 },
    { prob: 4.90, km: 200 },
    { prob: 2.94, km: 300 }
  ];

  // generator random km based on probability
  function randomKmGenerator (demandArray) {
    const reandomNumber = Math.random() * 100;
    let cummulator = 0;
    for (const item of demandArray) {
      cummulator += item.prob;
      if (reandomNumber < cummulator) return item.km;
    }
    return 0;
  }

  function chargingCalculator (){
    const theoreticalMaxPowerDemand = TOTAL_CHARGEPOINTS * CHARGE_RATE_KW; // in kW
    let totalEnergyConsumed = 0; // in kWh
    let actualMaxPowerDemand = 0; // in kW
    const chargepoints = Array(TOTAL_CHARGEPOINTS).fill(null); // 15mins chargepoints availability (null means available)

    for (let interval = 0; interval < TOTAL_INTERVALS; interval++) {
      const timeOfDayInHour = Math.floor((interval % (24 * INTERVALS_PER_HOUR)) / INTERVALS_PER_HOUR);
      const arrivalProbability = intervalArrivalProbabilities[timeOfDayInHour];
      let currentPowerDemand = 0;

      for (let chargingPoint = 0; chargingPoint < TOTAL_CHARGEPOINTS; chargingPoint++) {
        
        // if chargepoint is free and an EV arrives, calculate energy consumption
        if (chargepoints[chargingPoint] === null && Math.random() < arrivalProbability) {
        const kmToCharge = randomKmGenerator(chargingDemandProbabilities);
        const kWhToCharge = (kmToCharge / 100) * 18; // 18 kWh per 100 km
        const hoursToCharge = kWhToCharge / CHARGE_RATE_KW; // Time in hours to charge
        const intervalsToCharge = Math.ceil(hoursToCharge * INTERVALS_PER_HOUR); // Convert to intervals
        chargepoints[chargingPoint] = intervalsToCharge > 0 ? intervalsToCharge : null; // Set the charge duration if needed
        totalEnergyConsumed += kWhToCharge;
        }

        // if chargepoint is occupied, decrement the charge duration
        if (chargepoints[chargingPoint] !== null) {
          currentPowerDemand += CHARGE_RATE_KW;
          chargepoints[chargingPoint] -= 1;
          if (chargepoints[chargingPoint] === 0) chargepoints[chargingPoint] = null; // set chargepoint to available when charging is done
        }

        // if current power demand is greater than the actualMaxPowerDemand, update actualMaxPowerDemand
        if (currentPowerDemand > actualMaxPowerDemand) actualMaxPowerDemand = currentPowerDemand;
        
      }
    }

    const concurrencyFactor = actualMaxPowerDemand / theoreticalMaxPowerDemand;

    return {
      theoreticalMaxPowerDemand,
      totalEnergyConsumed,
      actualMaxPowerDemand,
      concurrencyFactor
    }
  }

  const {theoreticalMaxPowerDemand, totalEnergyConsumed, actualMaxPowerDemand, concurrencyFactor} = chargingCalculator();

  console.log('Theoretical Max Power Demand:', theoreticalMaxPowerDemand, 'kW');
  console.log('Total Energy Consumed:', totalEnergyConsumed.toFixed(2), 'kWh');
  console.log('Actual Max Power Demand:', actualMaxPowerDemand, 'kW');
  console.log('Concurrency Factor:', (concurrencyFactor * 100).toFixed(2), '%');




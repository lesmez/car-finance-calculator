import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  Box,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [carPrice, setCarPrice] = useState(30000);
  const [downPayment, setDownPayment] = useState(3000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [leaseTerm, setLeaseTerm] = useState(36);
  const [leasePayment, setLeasePayment] = useState(400);
  const [leaseDownPayment, setLeaseDownPayment] = useState(2000);
  const [loanTerm, setLoanTerm] = useState(60);
  const [interestRate, setInterestRate] = useState(4.5);
  const [investmentReturn, setInvestmentReturn] = useState(8);
  const [annualDepreciation, setAnnualDepreciation] = useState(15);
  const [comparison, setComparison] = useState(null);
  
  // New state variables for car search
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [years, setYears] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate years (from 1995 to current year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: currentYear - 1994 }, (_, i) => (currentYear - i).toString());
    setYears(yearsList);
  }, []);

  // Fetch makes when year changes
  useEffect(() => {
    const fetchMakes = async () => {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const response = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json&modelyear=${selectedYear}`
        );
        const data = await response.json();
        const makesList = data.Results.map(make => make.MakeName).sort();
        setMakes(makesList);
        setSelectedMake('');
        setSelectedModel('');
      } catch (error) {
        console.error('Error fetching makes:', error);
      }
      setLoading(false);
    };
    fetchMakes();
  }, [selectedYear]);

  // Fetch models when make changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedYear || !selectedMake) return;
      setLoading(true);
      try {
        const response = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${selectedMake}/modelyear/${selectedYear}?format=json`
        );
        const data = await response.json();
        const modelsList = data.Results.map(model => model.Model_Name).sort();
        setModels(modelsList);
        setSelectedModel('');
      } catch (error) {
        console.error('Error fetching models:', error);
      }
      setLoading(false);
    };
    fetchModels();
  }, [selectedYear, selectedMake]);

  // Estimate car price based on year, make, and model
  const estimateCarPrice = async () => {
    if (!selectedYear || !selectedMake || !selectedModel) return;
    
    // This is a simplified price estimation algorithm
    // In a real application, you would want to use a more sophisticated pricing API
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(selectedYear);
    
    // Base price ranges based on make (simplified)
    const basePriceRanges = {
      'BMW': { min: 35000, max: 85000 },
      'Mercedes-Benz': { min: 35000, max: 90000 },
      'Toyota': { min: 20000, max: 40000 },
      'Honda': { min: 20000, max: 35000 },
      'Ford': { min: 20000, max: 45000 },
      // Add more makes as needed
    };

    // Get base price range for the selected make, or use default range
    const priceRange = basePriceRanges[selectedMake] || { min: 25000, max: 45000 };
    
    // Calculate estimated new price
    const basePrice = (priceRange.min + priceRange.max) / 2;
    
    // Apply depreciation based on age
    const estimatedPrice = basePrice * Math.pow(0.85, age); // Assuming 15% annual depreciation
    
    setCarPrice(Math.round(estimatedPrice));
    setAnnualDepreciation(15); // Set default depreciation rate
  };

  // Update down payment when percentage changes
  useEffect(() => {
    const newDownPayment = Math.round((carPrice * downPaymentPercent) / 100);
    setDownPayment(newDownPayment);
  }, [carPrice, downPaymentPercent]);

  // Update percentage when down payment changes
  const handleDownPaymentChange = (value) => {
    setDownPayment(value);
    setDownPaymentPercent(Math.round((value / carPrice) * 100));
  };

  const calculateResidualValue = (initialPrice, months, annualDepreciationRate) => {
    const years = months / 12;
    return initialPrice * Math.pow(1 - annualDepreciationRate / 100, years);
  };

  const calculateComparison = () => {
    // Monthly loan payment calculation with down payment
    const loanAmount = carPrice - downPayment;
    const monthlyRate = interestRate / 1200;
    const monthlyLoanPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / 
      (Math.pow(1 + monthlyRate, loanTerm) - 1);

    // Calculate residual values
    const residualValueAtLeaseEnd = calculateResidualValue(carPrice, leaseTerm, annualDepreciation);
    const residualValueAtLoanEnd = calculateResidualValue(carPrice, loanTerm, annualDepreciation);
    
    // Total cost of buying (including car value at the end)
    const totalLoanCost = (monthlyLoanPayment * loanTerm) + downPayment;
    const netBuyingCost = totalLoanCost - residualValueAtLoanEnd;
    
    // Total cost of leasing (including need for new lease)
    const numberOfFullLeases = Math.floor(loanTerm / leaseTerm);
    const totalLeasingCostOverLoanPeriod = (leasePayment * leaseTerm + leaseDownPayment) * numberOfFullLeases;
    const remainingMonths = loanTerm % leaseTerm;
    const additionalLeaseCost = remainingMonths * leasePayment;
    const totalLeasePayments = totalLeasingCostOverLoanPeriod + additionalLeaseCost;
    
    // Monthly difference available for investment (including down payment difference)
    const downPaymentDifference = downPayment - leaseDownPayment;
    const monthlyInvestment = monthlyLoanPayment - leasePayment;
    
    // Calculate investment growth over loan term with initial down payment difference
    let investmentValue = downPaymentDifference;
    const monthlyReturnRate = investmentReturn / 1200;
    
    for (let i = 0; i < loanTerm; i++) {
      investmentValue = (investmentValue + monthlyInvestment) * (1 + monthlyReturnRate);
    }

    // Generate chart data for the entire loan term period
    const labels = Array.from({length: loanTerm}, (_, i) => i + 1);
    const buyingData = labels.map(month => {
      const totalPaid = downPayment + (month * monthlyLoanPayment);
      const currentResidual = calculateResidualValue(carPrice, month, annualDepreciation);
      return totalPaid - currentResidual;
    });
    
    const leasingData = labels.map(month => {
      const completedLeases = Math.floor(month / leaseTerm);
      const monthsInCurrentLease = month % leaseTerm;
      const totalLeaseAmount = (completedLeases * (leaseTerm * leasePayment + leaseDownPayment)) + 
        (monthsInCurrentLease * leasePayment) + 
        (monthsInCurrentLease === 0 ? leaseDownPayment : 0);
      
      // Calculate investment value at this point
      let currentInvestment = downPaymentDifference;
      for (let i = 0; i < month; i++) {
        currentInvestment = (currentInvestment + monthlyInvestment) * (1 + monthlyReturnRate);
      }
      
      return totalLeaseAmount - currentInvestment;
    });

    setComparison({
      monthlyLoanPayment,
      totalLoanCost,
      residualValueAtLoanEnd,
      netBuyingCost,
      totalLeasePayments,
      investmentValue,
      netLeaseCost: totalLeasePayments - investmentValue,
      chartData: {
        labels,
        datasets: [
          {
            label: 'Net Cost of Buying (Including Car Value)',
            data: buyingData,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
          },
          {
            label: 'Net Cost of Leasing (Including Investment Returns)',
            data: leasingData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Car Buy vs. Lease Calculator
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Input Parameters</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Car Selection
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  value={selectedYear}
                  onChange={(event, newValue) => setSelectedYear(newValue)}
                  options={years}
                  renderInput={(params) => <TextField {...params} label="Year" />}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  value={selectedMake}
                  onChange={(event, newValue) => setSelectedMake(newValue)}
                  options={makes}
                  renderInput={(params) => <TextField {...params} label="Make" />}
                  disabled={!selectedYear}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  value={selectedModel}
                  onChange={(event, newValue) => setSelectedModel(newValue)}
                  options={models}
                  renderInput={(params) => <TextField {...params} label="Model" />}
                  disabled={!selectedMake}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={estimateCarPrice}
                  disabled={!selectedYear || !selectedMake || !selectedModel}
                >
                  Estimate Car Price
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Car Price ($)"
                  type="number"
                  value={carPrice}
                  onChange={(e) => setCarPrice(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Down Payment ($)"
                      type="number"
                      value={downPayment}
                      onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Down Payment (%)"
                      type="number"
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Monthly Lease Payment ($)"
                  type="number"
                  value={leasePayment}
                  onChange={(e) => setLeasePayment(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lease Term (months)"
                  type="number"
                  value={leaseTerm}
                  onChange={(e) => setLeaseTerm(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lease Down Payment ($)"
                  type="number"
                  value={leaseDownPayment}
                  onChange={(e) => setLeaseDownPayment(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Loan Term (months)"
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Interest Rate (%)"
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expected Investment Return (%)"
                  type="number"
                  value={investmentReturn}
                  onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Annual Depreciation Rate (%)"
                  type="number"
                  value={annualDepreciation}
                  onChange={(e) => setAnnualDepreciation(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={calculateComparison}
                >
                  Calculate
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {comparison && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>Results</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography>Car Price: ${carPrice.toFixed(2)}</Typography>
                <Typography>Down Payment: ${downPayment.toFixed(2)} ({downPaymentPercent}%)</Typography>
                <Typography>Monthly Loan Payment: ${comparison.monthlyLoanPayment.toFixed(2)}</Typography>
                <Typography>Total Loan Payments: ${comparison.totalLoanCost.toFixed(2)}</Typography>
                <Typography>Car Value at Loan End: ${comparison.residualValueAtLoanEnd.toFixed(2)}</Typography>
                <Typography>Net Cost of Buying: ${comparison.netBuyingCost.toFixed(2)}</Typography>
                <Typography>Total Lease Payments: ${comparison.totalLeasePayments.toFixed(2)}</Typography>
                <Typography>Investment Value: ${comparison.investmentValue.toFixed(2)}</Typography>
                <Typography>Net Cost of Leasing: ${comparison.netLeaseCost.toFixed(2)}</Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Recommendation: {comparison.netLeaseCost < comparison.netBuyingCost ? 'Lease' : 'Buy'}
                </Typography>
              </Box>
              <Box sx={{ mt: 4 }}>
                <Line data={comparison.chartData} />
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;

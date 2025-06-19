// Integration code for App.jsx
import React from 'react';
import ChartNfciContributionsTableHighcharts from './components/extracted/ChartNfciContributionsTableHighcharts';
import ChartNfciRevisionsTableHighcharts from './components/extracted/ChartNfciRevisionsTableHighcharts';
import ChartNfciDecompositionHighcharts from './components/extracted/ChartNfciDecompositionHighcharts';
import ChartAnfciDecompositionHighcharts from './components/extracted/ChartAnfciDecompositionHighcharts';
import ChartAnfciContributionsHighcharts from './components/extracted/ChartAnfciContributionsHighcharts';
import ChartNfciContributionsHighcharts from './components/extracted/ChartNfciContributionsHighcharts';
import ChartHighchartsVp3kpmf4 from './components/extracted/ChartHighchartsVp3kpmf4';
import ChartHighchartsVp3kpmf12 from './components/extracted/ChartHighchartsVp3kpmf12';
import ChartChartContainer1033 from './components/extracted/ChartChartContainer1033';
import ChartHighchartsDataTable0 from './components/extracted/ChartHighchartsDataTable0';
import ChartHighchartsVp3kpmf34 from './components/extracted/ChartHighchartsVp3kpmf34';
import ChartHighchartsVp3kpmf20 from './components/extracted/ChartHighchartsVp3kpmf20';
import ChartChartContainer1706 from './components/extracted/ChartChartContainer1706';
import ChartHighchartsDataTable1 from './components/extracted/ChartHighchartsDataTable1';

import './components/extracted/extracted-styles.css';

// Add this to your App component:
const NFCIDataSection = () => {
  return (
    <div className="nfci-data-section">
      <h2>NFCI Interactive Charts</h2>
      <div className="charts-container">
        <ChartNfciContributionsTableHighcharts className="chart-wrapper" />
        <ChartNfciRevisionsTableHighcharts className="chart-wrapper" />
        <ChartNfciDecompositionHighcharts className="chart-wrapper" />
        <ChartAnfciDecompositionHighcharts className="chart-wrapper" />
        <ChartAnfciContributionsHighcharts className="chart-wrapper" />
        <ChartNfciContributionsHighcharts className="chart-wrapper" />
        <ChartHighchartsVp3kpmf4 className="chart-wrapper" />
        <ChartHighchartsVp3kpmf12 className="chart-wrapper" />
        <ChartChartContainer1033 className="chart-wrapper" />
        <ChartHighchartsDataTable0 className="chart-wrapper" />
        <ChartHighchartsVp3kpmf34 className="chart-wrapper" />
        <ChartHighchartsVp3kpmf20 className="chart-wrapper" />
        <ChartChartContainer1706 className="chart-wrapper" />
        <ChartHighchartsDataTable1 className="chart-wrapper" />
      </div>
      
      <h2>NFCI Data Tables</h2>
      <div className="tables-container">
        
      </div>
    </div>
  );
};

export default NFCIDataSection;
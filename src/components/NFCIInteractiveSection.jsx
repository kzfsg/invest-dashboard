import React, { useState, useEffect } from 'react';
import './NFCIInteractiveSection.css';

const NFCIInteractiveSection = ({ 
  className = '', 
  style = {} 
}) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExtractedComponents();
  }, []);

  const loadExtractedComponents = async () => {
    try {
      setLoading(true);
      
      // Dynamically import the component registry
      const { ComponentRegistry, ComponentMetadata } = await import('./extracted/index.js');
      
      const loadedComponents = [];
      
      for (const [name, loader] of Object.entries(ComponentRegistry)) {
        try {
          const component = React.lazy(loader);
          const metadata = ComponentMetadata[name];
          
          loadedComponents.push({
            name,
            type: metadata.type,
            component
          });
        } catch (err) {
          console.warn(`Failed to load component ${name}:`, err);
        }
      }
      
      setComponents(loadedComponents);
      setError(null);
    } catch (err) {
      console.error('Failed to load extracted components:', err);
      setError('Failed to load NFCI data. Please run the extraction script first.');
    } finally {
      setLoading(false);
    }
  };

  const renderComponent = (comp, index) => {
    const Component = comp.component;
    
    return (
      <React.Suspense 
        key={`${comp.name}-${index}`} 
        fallback={
          <div className="component-loading">
            <div className="loading-spinner" />
            <p>Loading {comp.name}...</p>
          </div>
        }
      >
        <div className={`component-wrapper ${comp.type}-wrapper`}>
          <h4 className="component-title">{comp.name.replace(/([A-Z])/g, ' $1').trim()}</h4>
          <Component className={`extracted-${comp.type}`} />
        </div>
      </React.Suspense>
    );
  };

  if (loading) {
    return (
      <div className={`nfci-interactive-section loading ${className}`} style={style}>
        <div className="section-loading">
          <div className="loading-spinner large" />
          <h3>Loading NFCI Interactive Data...</h3>
          <p>Preparing charts and tables from Chicago Fed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`nfci-interactive-section error ${className}`} style={style}>
        <div className="error-message">
          <h3>⚠️ NFCI Data Unavailable</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={loadExtractedComponents} className="retry-button">
              Try Again
            </button>
            <details className="extraction-help">
              <summary>How to extract NFCI data</summary>
              <ol>
                <li>Run: <code>node scripts/extract-and-convert.js</code></li>
                <li>Install dependencies: <code>npm install highcharts highcharts-react-official</code></li>
                <li>Refresh this page</li>
              </ol>
            </details>
          </div>
        </div>
      </div>
    );
  }

  const charts = components.filter(c => c.type === 'chart');
  const tables = components.filter(c => c.type === 'table');

  return (
    <div className={`nfci-interactive-section ${className}`} style={style}>
      <div className="section-header">
        <h2>National Financial Conditions Index (NFCI)</h2>
        <p className="section-description">
          Interactive charts and data tables from the Chicago Federal Reserve
        </p>
        <div className="extraction-info">
          <span>📊 {charts.length} Charts</span>
          <span>📋 {tables.length} Tables</span>
          <span>🕒 Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {charts.length > 0 && (
        <div className="charts-section">
          <h3>Interactive Charts</h3>
          <div className="components-grid charts-grid">
            {charts.map((chart, index) => renderComponent(chart, index))}
          </div>
        </div>
      )}

      {tables.length > 0 && (
        <div className="tables-section">
          <h3>Data Tables</h3>
          <div className="components-grid tables-grid">
            {tables.map((table, index) => renderComponent(table, index))}
          </div>
        </div>
      )}

      {components.length === 0 && (
        <div className="no-components">
          <h3>No NFCI Components Available</h3>
          <p>Run the extraction script to generate interactive components:</p>
          <code>node scripts/extract-and-convert.js</code>
        </div>
      )}
    </div>
  );
};

export default NFCIInteractiveSection;
import React, { useEffect, useState, useMemo } from 'react';
import { parseTableData } from '../../utils/parseTableData';
import './NFCIDataTable.css';

interface NFCIDataTableProps {
  dataUrl: string;
  title?: string;
  className?: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

const NFCIDataTable: React.FC<NFCIDataTableProps> = ({ 
  dataUrl,
  title = "NFCI Data Table",
  className = '',
  containerProps = {}
}) => {
  const [tableData, setTableData] = useState<{series: string; values: number[]}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const parsedData = parseTableData(html);
        setTableData(parsedData);
      } catch (err) {
        console.error('Error loading table data:', err);
        setError('Failed to load table data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableData();
  }, [dataUrl]);

  const columns = useMemo(() => {
    if (tableData.length === 0) return [];
    const maxLength = Math.max(...tableData.map(row => row.values.length));
    return Array.from({ length: maxLength }, (_, i) => `T-${i + 1}`);
  }, [tableData]);

  if (isLoading) {
    return <div>Loading table data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (tableData.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div 
      className={`nfcidatatable-container ${className}`} 
      style={{ 
        width: '100%',
        overflowX: 'auto',
        margin: '20px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        ...containerProps.style 
      }}
      {...containerProps}
    >
      <h3 style={{ 
        padding: '10px 15px',
        margin: 0,
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        {title}
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}
        >
          <thead>
            <tr>
              <th 
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#f9f9f9',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}
              >
                Series
              </th>
              {columns.map((col, index) => (
                <th 
                  key={index}
                  style={{
                    padding: '10px',
                    textAlign: 'right',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f9f9f9',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr 
                key={row.series}
                className={`table-row ${rowIndex % 2 === 0 ? 'even' : 'odd'}`}
              >
                <td 
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.series}
                </td>
                {row.values.map((value, colIndex) => (
                  <td 
                    key={colIndex}
                    style={{
                      padding: '10px',
                      textAlign: 'right',
                      borderBottom: '1px solid #e0e0e0',
                      fontFamily: 'monospace'
                    }}
                  >
                    {value.toFixed(3)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NFCIDataTable;

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import "./App.css";
import Silk from "./components/background/Silk";
import Aurora from "./components/background/Aurora";
import AnimationOverlay from "./components/AnimationOverlay";
import NFCIDataTable from "./components/charts/NFCIDataTable";

function App() {
  const [background, setBackground] = useState<"silk" | "aurora">("silk");
  const [isMounted, setIsMounted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  // Start with the content hidden until the animation completes
  useEffect(() => {
    // This effect is intentionally empty, just to ensure the initial state is correct
  }, []);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    // Small delay before showing the main content
    setTimeout(() => setIsMounted(true), 500);
  };

  const toggleBackground = () => {
    setBackground((prev) => (prev === "silk" ? "aurora" : "silk"));
  };

  return (
    <div className="app">
      {showAnimation && (
        <AnimationOverlay onComplete={handleAnimationComplete} />
      )}
      {isMounted && (
        <>
          {background === "silk" ? (
            <Silk
              speed={8}
              scale={1}
              color="#7B7481"
              noiseIntensity={1.5}
              rotation={0}
            />
          ) : (
            <Aurora
              colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
              blend={0.5}
              amplitude={1.0}
              speed={2}
            />
          )}
        </>
      )}

      <Navbar toggleBackground={toggleBackground} background={background} />
      <div className="content">
        <div className="logo-container">
          <img src="/assets/Statsboard.png" alt="Logo" className="main-logo" />
          <div className="filter-buttons">
            {["US", "China", "EU", "EMs", "Macro"].map((filter) => (
              <button
                key={filter}
                className="filter-button"
                onClick={() => console.log(`Filter by ${filter}`)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* NFCI Data Table */}
          <div
            style={{
              marginTop: "40px",
              width: "100%",
              maxWidth: "1200px",
              margin: "40px auto 0",
            }}
          >
            <NFCIDataTable
              dataUrl="/screenshotScripts/nfci_html_extracts/chart_4_highcharts-data-table-1.html"
              title="NFCI Data Table"
              containerProps={{
                style: {
                  width: "100%",
                  margin: "0 auto",
                  padding: "0 20px",
                  boxSizing: "border-box",
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="cards-container">
        <div className="card">
          <h3>NFCI Data Table</h3>
          <div className="card-content">
            <div style={{ width: "100%" }}>
              <NFCIDataTable
                dataUrl="/screenshotScripts/nfci_html_extracts/chart_4_highcharts-data-table-1.html"
                title="NFCI Data Table"
                containerProps={{
                  style: {
                    width: "100%",
                    margin: "0",
                    padding: "0",
                    boxSizing: "border-box",
                  },
                }}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Card 2</h3>
          <div className="card-content">
            <p>This is the second card with some content.</p>
            <p>Additional content to demonstrate scrolling...</p>
            <p>More content...</p>
            <p>Even more content...</p>
            <p>Keep going...</p>
            <p>Almost there...</p>
            <p>Final content item.</p>
          </div>
        </div>
        <div className="card">
          <h3>Card 3</h3>
          <div className="card-content">
            <p>This is the third card with some content.</p>
            <p>Additional content to demonstrate scrolling...</p>
            <p>More content...</p>
            <p>Even more content...</p>
            <p>Keep going...</p>
            <p>Almost there...</p>
            <p>Final content item.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

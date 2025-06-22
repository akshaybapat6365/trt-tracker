import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Canvas Test</title>
      <style>
        body {
          background: #1a1a1a;
          color: white;
          font-family: sans-serif;
          padding: 20px;
        }
        canvas {
          border: 1px solid #444;
          display: block;
          margin: 20px 0;
        }
        button {
          background: #4a4a4a;
          color: white;
          border: none;
          padding: 10px 20px;
          margin: 10px;
          cursor: pointer;
        }
        button:hover {
          background: #5a5a5a;
        }
        .log {
          background: #2a2a2a;
          padding: 10px;
          margin: 10px 0;
          font-family: monospace;
          font-size: 12px;
          max-height: 200px;
          overflow-y: auto;
        }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .info { color: #fbbf24; }
      </style>
    </head>
    <body>
      <h1>Canvas API Test Page</h1>
      <p>This page tests various Canvas API features to debug export issues.</p>
      
      <h2>Tests:</h2>
      <button onclick="testBasicCanvas()">Test Basic Canvas</button>
      <button onclick="testTextRendering()">Test Text Rendering</button>
      <button onclick="testComplexDrawing()">Test Complex Drawing</button>
      <button onclick="testToDataURL()">Test toDataURL</button>
      <button onclick="testAllFeatures()">Run All Tests</button>
      
      <canvas id="testCanvas" width="400" height="300"></canvas>
      
      <h2>Results:</h2>
      <div id="log" class="log"></div>
      
      <h2>Data URL Output:</h2>
      <textarea id="dataUrl" style="width: 100%; height: 100px; background: #2a2a2a; color: white;"></textarea>
      
      <script>
        const canvas = document.getElementById('testCanvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const log = document.getElementById('log');
        const dataUrlOutput = document.getElementById('dataUrl');
        
        function addLog(message, type = 'info') {
          const time = new Date().toLocaleTimeString();
          const className = type;
          log.innerHTML += '<div class="' + className + '">[' + time + '] ' + message + '</div>';
          log.scrollTop = log.scrollHeight;
        }
        
        function clearCanvas() {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        function testBasicCanvas() {
          addLog('Testing basic canvas operations...', 'info');
          try {
            clearCanvas();
            
            // Test basic shapes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(50, 50, 100, 100);
            addLog('✓ Drew red rectangle', 'success');
            
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(250, 100, 50, 0, Math.PI * 2);
            ctx.fill();
            addLog('✓ Drew green circle', 'success');
            
            // Test toDataURL
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 100) {
              addLog('✓ toDataURL successful, length: ' + dataUrl.length, 'success');
              dataUrlOutput.value = dataUrl.substring(0, 100) + '...';
            } else {
              addLog('✗ toDataURL failed or returned empty', 'error');
            }
          } catch (e) {
            addLog('✗ Error: ' + e.message, 'error');
          }
        }
        
        function testTextRendering() {
          addLog('Testing text rendering...', 'info');
          try {
            clearCanvas();
            
            // Test different fonts
            const fonts = ['sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica'];
            let y = 30;
            
            fonts.forEach(font => {
              try {
                ctx.font = '16px ' + font;
                ctx.fillStyle = '#fbbf24';
                ctx.fillText('Test with ' + font, 20, y);
                addLog('✓ Rendered text with ' + font, 'success');
                y += 30;
              } catch (e) {
                addLog('✗ Failed to render with ' + font + ': ' + e.message, 'error');
              }
            });
            
            // Test toDataURL
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 100) {
              addLog('✓ toDataURL after text rendering successful', 'success');
            } else {
              addLog('✗ toDataURL after text rendering failed', 'error');
            }
          } catch (e) {
            addLog('✗ Error: ' + e.message, 'error');
          }
        }
        
        function testComplexDrawing() {
          addLog('Testing complex drawing (calendar-like)...', 'info');
          try {
            clearCanvas();
            
            // Draw grid
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            
            const cellSize = 40;
            const cols = 7;
            const rows = 5;
            
            for (let i = 0; i <= cols; i++) {
              ctx.beginPath();
              ctx.moveTo(20 + i * cellSize, 20);
              ctx.lineTo(20 + i * cellSize, 20 + rows * cellSize);
              ctx.stroke();
            }
            
            for (let i = 0; i <= rows; i++) {
              ctx.beginPath();
              ctx.moveTo(20, 20 + i * cellSize);
              ctx.lineTo(20 + cols * cellSize, 20 + i * cellSize);
              ctx.stroke();
            }
            
            addLog('✓ Drew grid', 'success');
            
            // Add some cells with colors
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(60, 60, cellSize - 2, cellSize - 2);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(100, 100, cellSize - 2, cellSize - 2);
            
            addLog('✓ Filled cells with colors', 'success');
            
            // Add text in cells
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                const num = row * cols + col + 1;
                const x = 20 + col * cellSize + cellSize / 2;
                const y = 20 + row * cellSize + cellSize / 2;
                ctx.fillText(num.toString(), x, y);
              }
            }
            
            addLog('✓ Added text to cells', 'success');
            
            // Test toDataURL
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 100) {
              addLog('✓ toDataURL after complex drawing successful', 'success');
            } else {
              addLog('✗ toDataURL after complex drawing failed', 'error');
            }
          } catch (e) {
            addLog('✗ Error: ' + e.message, 'error');
          }
        }
        
        function testToDataURL() {
          addLog('Testing toDataURL with different formats...', 'info');
          try {
            // Ensure something is drawn
            clearCanvas();
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000000';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('toDataURL Test', canvas.width / 2, canvas.height / 2);
            
            // Test PNG
            const pngUrl = canvas.toDataURL('image/png');
            addLog('PNG length: ' + pngUrl.length + ', starts with: ' + pngUrl.substring(0, 30), 'info');
            
            // Test JPEG
            const jpegUrl = canvas.toDataURL('image/jpeg', 0.8);
            addLog('JPEG length: ' + jpegUrl.length + ', starts with: ' + jpegUrl.substring(0, 30), 'info');
            
            // Test with no arguments
            const defaultUrl = canvas.toDataURL();
            addLog('Default length: ' + defaultUrl.length + ', starts with: ' + defaultUrl.substring(0, 30), 'info');
            
            // Validate data URLs
            if (pngUrl === 'data:,' || pngUrl.length < 100) {
              addLog('✗ PNG export failed - empty or too short', 'error');
            } else {
              addLog('✓ PNG export successful', 'success');
            }
            
            dataUrlOutput.value = pngUrl;
          } catch (e) {
            addLog('✗ Error in toDataURL: ' + e.message, 'error');
          }
        }
        
        function testAllFeatures() {
          log.innerHTML = '';
          addLog('Running all tests...', 'info');
          
          setTimeout(() => testBasicCanvas(), 100);
          setTimeout(() => testTextRendering(), 1000);
          setTimeout(() => testComplexDrawing(), 2000);
          setTimeout(() => testToDataURL(), 3000);
        }
        
        // Run basic test on load
        window.onload = () => {
          addLog('Canvas test page loaded', 'info');
          addLog('Canvas dimensions: ' + canvas.width + 'x' + canvas.height, 'info');
          addLog('User Agent: ' + navigator.userAgent, 'info');
          testBasicCanvas();
        };
      </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
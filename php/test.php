<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECOBEEP - API Debug Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f6fa;
        }
        .test-section {
            background: white;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .test-section h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .result {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 300px;
            overflow-y: auto;
        }
        .success { border-left: 4px solid #27ae60; }
        .error { border-left: 4px solid #e74c3c; }
        .loading { border-left: 4px solid #3498db; }
        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #2980b9;
        }
        .path-info {
            background: #fff3cd;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <h1>🔧 ECOBEEP API Debug Test</h1>
    
    <div class="path-info">
        <strong>Current page location:</strong> <span id="currentPath"></span><br>
        <strong>API path being tested:</strong> <span id="apiPath"></span>
    </div>

    <div class="test-section">
        <h3>Test 1: API Connection Test</h3>
        <button onclick="testAPI()">Run Test</button>
        <div id="test1Result" class="result loading">Click "Run Test" to start...</div>
    </div>

    <div class="test-section">
        <h3>Test 2: Get All Data</h3>
        <button onclick="testGetAllData()">Run Test</button>
        <div id="test2Result" class="result loading">Click "Run Test" to start...</div>
    </div>

    <div class="test-section">
        <h3>Test 3: Get Available Drivers</h3>
        <button onclick="testGetDrivers()">Run Test</button>
        <div id="test3Result" class="result loading">Click "Run Test" to start...</div>
    </div>

    <div class="test-section">
        <h3>Test 4: Try Different API Paths</h3>
        <button onclick="tryAllPaths()">Try All Paths</button>
        <div id="test4Result" class="result loading">Click "Try All Paths" to find working path...</div>
    </div>

    <script>
        // Show current location
        document.getElementById('currentPath').textContent = window.location.href;
        
        // The API path we're using
        const API_URL = '../php/assign-driver-api.php';
        document.getElementById('apiPath').textContent = API_URL;

        async function testAPI() {
            const resultDiv = document.getElementById('test1Result');
            resultDiv.className = 'result loading';
            resultDiv.textContent = 'Testing...';

            try {
                const response = await fetch(`${API_URL}?action=test`);
                const text = await response.text();
                
                try {
                    const data = JSON.parse(text);
                    resultDiv.className = 'result success';
                    resultDiv.textContent = '✅ SUCCESS!\n\n' + JSON.stringify(data, null, 2);
                } catch (e) {
                    resultDiv.className = 'result error';
                    resultDiv.textContent = '❌ Invalid JSON response:\n\n' + text;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.textContent = '❌ FETCH ERROR:\n\n' + error.message + '\n\nThis usually means:\n1. Wrong API path\n2. Server not running\n3. CORS issue';
            }
        }

        async function testGetAllData() {
            const resultDiv = document.getElementById('test2Result');
            resultDiv.className = 'result loading';
            resultDiv.textContent = 'Testing...';

            try {
                const response = await fetch(`${API_URL}?action=get_all_data`);
                const text = await response.text();
                
                try {
                    const data = JSON.parse(text);
                    resultDiv.className = 'result success';
                    resultDiv.textContent = '✅ SUCCESS!\n\nStats:\n' + JSON.stringify(data.stats, null, 2) + 
                        '\n\nAssignments: ' + (data.assignments?.length || 0) +
                        '\nUnassigned Vehicles: ' + (data.unassigned_vehicles?.length || 0) +
                        '\nAvailable Drivers: ' + (data.available_drivers?.length || 0);
                } catch (e) {
                    resultDiv.className = 'result error';
                    resultDiv.textContent = '❌ Invalid JSON:\n\n' + text.substring(0, 500);
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.textContent = '❌ FETCH ERROR:\n\n' + error.message;
            }
        }

        async function testGetDrivers() {
            const resultDiv = document.getElementById('test3Result');
            resultDiv.className = 'result loading';
            resultDiv.textContent = 'Testing...';

            try {
                const response = await fetch(`${API_URL}?action=get_available_drivers`);
                const text = await response.text();
                
                try {
                    const data = JSON.parse(text);
                    if (data.success && data.data) {
                        resultDiv.className = 'result success';
                        resultDiv.textContent = '✅ SUCCESS!\n\nFound ' + data.data.length + ' available drivers:\n\n' +
                            data.data.map(d => `- ${d.full_name || (d.first_name + ' ' + d.last_name)} (${d.license_number})`).join('\n');
                    } else {
                        resultDiv.className = 'result error';
                        resultDiv.textContent = '❌ API returned error:\n\n' + JSON.stringify(data, null, 2);
                    }
                } catch (e) {
                    resultDiv.className = 'result error';
                    resultDiv.textContent = '❌ Invalid JSON:\n\n' + text.substring(0, 500);
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.textContent = '❌ FETCH ERROR:\n\n' + error.message;
            }
        }

        async function tryAllPaths() {
            const resultDiv = document.getElementById('test4Result');
            resultDiv.className = 'result loading';
            resultDiv.textContent = 'Trying different paths...';

            const paths = [
                '../php/assign-driver-api.php',
                './php/assign-driver-api.php',
                'php/assign-driver-api.php',
                '/ecobeep/php/assign-driver-api.php',
                '/php/assign-driver-api.php',
                '../../php/assign-driver-api.php'
            ];

            let results = [];

            for (const path of paths) {
                try {
                    const response = await fetch(`${path}?action=test`);
                    const text = await response.text();
                    
                    try {
                        const data = JSON.parse(text);
                        if (data.success) {
                            results.push(`✅ ${path} - WORKS!`);
                        } else {
                            results.push(`⚠️ ${path} - Returns: ${text.substring(0, 50)}`);
                        }
                    } catch (e) {
                        results.push(`❌ ${path} - Invalid JSON: ${text.substring(0, 30)}...`);
                    }
                } catch (error) {
                    results.push(`❌ ${path} - ${error.message}`);
                }
            }

            resultDiv.className = 'result';
            resultDiv.textContent = 'Path Test Results:\n\n' + results.join('\n');
        }

        // Auto-run first test on load
        window.onload = function() {
            testAPI();
        };
    </script>
</body>
</html>
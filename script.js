class StockScope {
    constructor() {
        this.portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
        this.alerts = JSON.parse(localStorage.getItem('alerts')) || [];
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadPortfolio();
        this.loadAlerts();
        this.loadWatchlist();
        this.requestNotificationPermission();
        this.startAlertChecking();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('search-btn');
        const symbolInput = document.getElementById('symbol-input');
        const addAlertBtn = document.getElementById('add-alert');
        const addWatchlistBtn = document.getElementById('add-watchlist');

        searchBtn.addEventListener('click', () => this.searchStock());
        symbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchStock();
        });

        if (addAlertBtn) {
            addAlertBtn.addEventListener('click', () => this.addAlert());
        }

        if (addWatchlistBtn) {
            addWatchlistBtn.addEventListener('click', () => this.addToWatchlist());
        }

        const compareBtn = document.getElementById('compare-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.compareStocks());
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.showSection(targetId);
            });
        });
    }

    showSection(sectionId) {
        const sections = document.querySelectorAll('main section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    async searchStock() {
        const symbol = document.getElementById('symbol-input').value.toUpperCase();
        if (!symbol) return;

        const stockInfo = document.getElementById('stock-info');
        stockInfo.innerHTML = '<p>Loading...</p>';

        try {
            const mockData = this.generateMockStockData(symbol);
            this.displayStockInfo(mockData);
        } catch (error) {
            stockInfo.innerHTML = '<p>Error fetching stock data. Please try again.</p>';
        }
    }

    generateMockStockData(symbol) {
        const basePrice = Math.random() * 200 + 50;
        const change = (Math.random() - 0.5) * 10;
        const changePercent = (change / basePrice * 100);

        return {
            symbol: symbol,
            name: `${symbol} Corp`,
            price: basePrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            volume: Math.floor(Math.random() * 10000000),
            marketCap: (basePrice * Math.random() * 1000000).toFixed(0)
        };
    }

    displayStockInfo(data) {
        const stockInfo = document.getElementById('stock-info');
        const changeClass = parseFloat(data.change) >= 0 ? 'positive' : 'negative';
        const changeSymbol = parseFloat(data.change) >= 0 ? '+' : '';

        stockInfo.innerHTML = `
            <div class="stock-card">
                <h3>${data.symbol} - ${data.name}</h3>
                <div class="stock-price">$${data.price}</div>
                <div class="stock-change ${changeClass}">
                    ${changeSymbol}${data.change} (${changeSymbol}${data.changePercent}%)
                </div>
                <div class="stock-details">
                    <p><strong>Volume:</strong> ${data.volume.toLocaleString()}</p>
                    <p><strong>Market Cap:</strong> $${parseInt(data.marketCap).toLocaleString()}</p>
                </div>
                <button onclick="app.addToPortfolio('${data.symbol}', ${data.price})">Add to Portfolio</button>
                <button onclick="app.showChart('${data.symbol}')">Show Chart</button>
                <button onclick="app.addToWatchlistFromStock('${data.symbol}')">Add to Watchlist</button>
            </div>
        `;
    }

    addToPortfolio(symbol, price) {
        const shares = prompt(`How many shares of ${symbol} do you want to add?`);
        if (shares && !isNaN(shares) && parseFloat(shares) > 0) {
            const holding = {
                symbol: symbol,
                shares: parseFloat(shares),
                avgPrice: parseFloat(price),
                dateAdded: new Date().toISOString()
            };
            this.portfolio.push(holding);
            this.savePortfolio();
            this.loadPortfolio();
            alert(`Added ${shares} shares of ${symbol} to your portfolio!`);
        }
    }

    loadPortfolio() {
        const holdings = document.getElementById('holdings');
        if (!holdings) return;

        if (this.portfolio.length === 0) {
            holdings.innerHTML = '<p>No holdings yet. Search for stocks and add them to your portfolio.</p>';
            return;
        }

        let totalValue = 0;
        let holdingsHTML = '';

        this.portfolio.forEach((holding, index) => {
            const currentPrice = this.generateMockStockData(holding.symbol).price;
            const value = holding.shares * currentPrice;
            const gainLoss = (currentPrice - holding.avgPrice) * holding.shares;
            const gainLossPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice * 100);

            totalValue += value;

            holdingsHTML += `
                <div class="stock-card">
                    <h4>${holding.symbol}</h4>
                    <p><strong>Shares:</strong> ${holding.shares}</p>
                    <p><strong>Avg Price:</strong> $${holding.avgPrice.toFixed(2)}</p>
                    <p><strong>Current Price:</strong> $${currentPrice}</p>
                    <p><strong>Value:</strong> $${value.toFixed(2)}</p>
                    <p><strong>Gain/Loss:</strong> <span class="${gainLoss >= 0 ? 'positive' : 'negative'}">
                        $${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)
                    </span></p>
                    <div class="holding-actions">
                        <button onclick="app.editHolding(${index})">Edit</button>
                        <button onclick="app.removeFromPortfolio(${index})">Remove</button>
                    </div>
                </div>
            `;
        });

        holdings.innerHTML = holdingsHTML;

        const summary = document.getElementById('portfolio-summary');
        if (summary) {
            summary.innerHTML = `
                <p><strong>Total Value:</strong> $${totalValue.toFixed(2)}</p>
                <p><strong>Holdings:</strong> ${this.portfolio.length} stocks</p>
            `;
        }
    }

    editHolding(index) {
        const holding = this.portfolio[index];
        const newShares = prompt(`Edit shares for ${holding.symbol}:`, holding.shares);
        const newAvgPrice = prompt(`Edit average price for ${holding.symbol}:`, holding.avgPrice);

        if (newShares !== null && newAvgPrice !== null &&
            !isNaN(newShares) && !isNaN(newAvgPrice) &&
            parseFloat(newShares) > 0 && parseFloat(newAvgPrice) > 0) {

            this.portfolio[index].shares = parseFloat(newShares);
            this.portfolio[index].avgPrice = parseFloat(newAvgPrice);
            this.savePortfolio();
            this.loadPortfolio();
        }
    }

    removeFromPortfolio(index) {
        if (confirm('Are you sure you want to remove this holding?')) {
            this.portfolio.splice(index, 1);
            this.savePortfolio();
            this.loadPortfolio();
        }
    }

    addAlert() {
        const symbol = document.getElementById('alert-symbol').value.toUpperCase();
        const targetPrice = parseFloat(document.getElementById('alert-price').value);

        if (symbol && targetPrice > 0) {
            const alert = {
                symbol: symbol,
                targetPrice: targetPrice,
                dateCreated: new Date().toISOString()
            };
            this.alerts.push(alert);
            this.saveAlerts();
            this.loadAlerts();

            document.getElementById('alert-symbol').value = '';
            document.getElementById('alert-price').value = '';
        }
    }

    loadAlerts() {
        const alertList = document.getElementById('alert-list');
        if (!alertList) return;

        if (this.alerts.length === 0) {
            alertList.innerHTML = '<p>No price alerts set.</p>';
            return;
        }

        let alertsHTML = '';
        this.alerts.forEach((alert, index) => {
            const isTriggered = alert.triggered;
            const cardClass = isTriggered ? 'stock-card triggered-alert' : 'stock-card';

            alertsHTML += `
                <div class="${cardClass}">
                    <h4>${alert.symbol}</h4>
                    <p><strong>Target Price:</strong> $${alert.targetPrice.toFixed(2)}</p>
                    <p><strong>Created:</strong> ${new Date(alert.dateCreated).toLocaleDateString()}</p>
                    ${isTriggered ? `<p><strong>Triggered:</strong> ${new Date(alert.triggerDate).toLocaleDateString()}</p>` : ''}
                    <button onclick="app.removeAlert(${index})">Remove Alert</button>
                </div>
            `;
        });

        if (this.alerts.some(alert => alert.triggered)) {
            alertsHTML = '<button onclick="app.clearTriggeredAlerts()">Clear Triggered Alerts</button>' + alertsHTML;
        }

        alertList.innerHTML = alertsHTML;
    }

    removeAlert(index) {
        this.alerts.splice(index, 1);
        this.saveAlerts();
        this.loadAlerts();
    }

    savePortfolio() {
        try {
            localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
            localStorage.setItem('portfolioBackup', JSON.stringify({
                data: this.portfolio,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Failed to save portfolio:', e);
        }
    }

    saveAlerts() {
        try {
            localStorage.setItem('alerts', JSON.stringify(this.alerts));
            localStorage.setItem('alertsBackup', JSON.stringify({
                data: this.alerts,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Failed to save alerts:', e);
        }
    }

    exportData() {
        const data = {
            portfolio: this.portfolio,
            alerts: this.alerts,
            watchlist: this.watchlist,
            exportDate: new Date().toISOString(),
            version: '1.1'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stockscope-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.portfolio) this.portfolio = data.portfolio;
                if (data.alerts) this.alerts = data.alerts;
                if (data.watchlist) this.watchlist = data.watchlist;
                this.savePortfolio();
                this.saveAlerts();
                this.saveWatchlist();
                this.loadPortfolio();
                this.loadAlerts();
                this.loadWatchlist();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    showChart(symbol) {
        const chartDiv = document.getElementById('stock-chart');
        const canvas = document.getElementById('price-chart');
        const ctx = canvas.getContext('2d');

        chartDiv.style.display = 'block';

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const data = this.generateMockChartData();

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxPrice = Math.max(...data);
        const minPrice = Math.min(...data);
        const priceRange = maxPrice - minPrice;

        for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1)) * (canvas.width - 40) + 20;
            const y = canvas.height - 20 - ((data[i] - minPrice) / priceRange) * (canvas.height - 40);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText(`${symbol} - 30 Day Price Chart`, 20, 15);
        ctx.fillText(`$${minPrice.toFixed(2)}`, 5, canvas.height - 5);
        ctx.fillText(`$${maxPrice.toFixed(2)}`, 5, 20);
    }

    generateMockChartData() {
        const data = [];
        let price = 100 + Math.random() * 50;

        for (let i = 0; i < 30; i++) {
            price += (Math.random() - 0.5) * 5;
            data.push(Math.max(10, price));
        }

        return data;
    }

    addToWatchlist() {
        const symbol = document.getElementById('watchlist-symbol').value.toUpperCase();
        if (symbol && !this.watchlist.find(item => item.symbol === symbol)) {
            const watchlistItem = {
                symbol: symbol,
                dateAdded: new Date().toISOString()
            };
            this.watchlist.push(watchlistItem);
            this.saveWatchlist();
            this.loadWatchlist();
            document.getElementById('watchlist-symbol').value = '';
        }
    }

    addToWatchlistFromStock(symbol) {
        if (!this.watchlist.find(item => item.symbol === symbol)) {
            const watchlistItem = {
                symbol: symbol,
                dateAdded: new Date().toISOString()
            };
            this.watchlist.push(watchlistItem);
            this.saveWatchlist();
            this.loadWatchlist();
            alert(`${symbol} added to watchlist!`);
        } else {
            alert(`${symbol} is already in your watchlist!`);
        }
    }

    loadWatchlist() {
        const watchlistItems = document.getElementById('watchlist-items');
        if (!watchlistItems) return;

        if (this.watchlist.length === 0) {
            watchlistItems.innerHTML = '<p>No stocks in watchlist yet.</p>';
            return;
        }

        let watchlistHTML = '';
        this.watchlist.forEach((item, index) => {
            const mockData = this.generateMockStockData(item.symbol);
            const changeClass = parseFloat(mockData.change) >= 0 ? 'positive' : 'negative';
            const changeSymbol = parseFloat(mockData.change) >= 0 ? '+' : '';

            watchlistHTML += `
                <div class="stock-card">
                    <h4>${item.symbol}</h4>
                    <div class="stock-price">$${mockData.price}</div>
                    <div class="stock-change ${changeClass}">
                        ${changeSymbol}${mockData.change} (${changeSymbol}${mockData.changePercent}%)
                    </div>
                    <p><strong>Added:</strong> ${new Date(item.dateAdded).toLocaleDateString()}</p>
                    <div class="watchlist-actions">
                        <button onclick="app.showChart('${item.symbol}')">Chart</button>
                        <button onclick="app.addToPortfolio('${item.symbol}', ${mockData.price})">Add to Portfolio</button>
                        <button onclick="app.removeFromWatchlist(${index})">Remove</button>
                    </div>
                </div>
            `;
        });

        watchlistItems.innerHTML = watchlistHTML;
    }

    removeFromWatchlist(index) {
        this.watchlist.splice(index, 1);
        this.saveWatchlist();
        this.loadWatchlist();
    }

    saveWatchlist() {
        try {
            localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        } catch (e) {
            console.error('Failed to save watchlist:', e);
        }
    }

    clearOldBackups() {
        const backupKeys = ['portfolioBackup', 'alertsBackup'];
        backupKeys.forEach(key => {
            const backup = localStorage.getItem(key);
            if (backup) {
                try {
                    const backupData = JSON.parse(backup);
                    const backupDate = new Date(backupData.timestamp);
                    const daysDiff = (Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysDiff > 30) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    getStorageUsage() {
        let totalSize = 0;
        const usage = {};

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = new Blob([localStorage[key]]).size;
                totalSize += size;
                usage[key] = size;
            }
        }

        return { total: totalSize, breakdown: usage };
    }

    compressData() {
        const now = new Date().toISOString();
        const compactData = {
            p: this.portfolio.map(h => ({
                s: h.symbol,
                sh: h.shares,
                ap: h.avgPrice,
                da: h.dateAdded
            })),
            a: this.alerts.map(a => ({
                s: a.symbol,
                tp: a.targetPrice,
                dc: a.dateCreated
            })),
            w: this.watchlist.map(w => ({
                s: w.symbol,
                da: w.dateAdded
            })),
            lu: now
        };

        try {
            localStorage.setItem('compactData', JSON.stringify(compactData));
            this.clearOldBackups();
        } catch (e) {
            console.error('Failed to compress data:', e);
        }
    }

    compareStocks() {
        const symbol1 = document.getElementById('compare-stock1').value.toUpperCase();
        const symbol2 = document.getElementById('compare-stock2').value.toUpperCase();

        if (!symbol1 || !symbol2) {
            alert('Please enter both stock symbols');
            return;
        }

        const stock1Data = this.generateMockStockData(symbol1);
        const stock2Data = this.generateMockStockData(symbol2);

        this.displayComparison(stock1Data, stock2Data);
    }

    displayComparison(stock1, stock2) {
        const resultsDiv = document.getElementById('comparison-results');

        const getChangeClass = (change) => parseFloat(change) >= 0 ? 'positive' : 'negative';
        const getChangeSymbol = (change) => parseFloat(change) >= 0 ? '+' : '';

        const stock1Change = getChangeClass(stock1.change);
        const stock2Change = getChangeClass(stock2.change);
        const stock1Symbol = getChangeSymbol(stock1.change);
        const stock2Symbol = getChangeSymbol(stock2.change);

        resultsDiv.innerHTML = `
            <div class="comparison-container">
                <div class="comparison-stock">
                    <h3>${stock1.symbol}</h3>
                    <div class="stock-price">$${stock1.price}</div>
                    <div class="stock-change ${stock1Change}">
                        ${stock1Symbol}${stock1.change} (${stock1Symbol}${stock1.changePercent}%)
                    </div>
                    <div class="stock-details">
                        <p><strong>Volume:</strong> ${stock1.volume.toLocaleString()}</p>
                        <p><strong>Market Cap:</strong> $${parseInt(stock1.marketCap).toLocaleString()}</p>
                    </div>
                </div>

                <div class="comparison-vs">VS</div>

                <div class="comparison-stock">
                    <h3>${stock2.symbol}</h3>
                    <div class="stock-price">$${stock2.price}</div>
                    <div class="stock-change ${stock2Change}">
                        ${stock2Symbol}${stock2.change} (${stock2Symbol}${stock2.changePercent}%)
                    </div>
                    <div class="stock-details">
                        <p><strong>Volume:</strong> ${stock2.volume.toLocaleString()}</p>
                        <p><strong>Market Cap:</strong> $${parseInt(stock2.marketCap).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div class="comparison-analysis">
                <h4>Quick Analysis</h4>
                <ul>
                    <li><strong>Price Winner:</strong> ${parseFloat(stock1.price) > parseFloat(stock2.price) ? stock1.symbol : stock2.symbol} (Higher price)</li>
                    <li><strong>Performance:</strong> ${parseFloat(stock1.changePercent) > parseFloat(stock2.changePercent) ? stock1.symbol : stock2.symbol} (Better daily performance)</li>
                    <li><strong>Volume:</strong> ${stock1.volume > stock2.volume ? stock1.symbol : stock2.symbol} (Higher trading volume)</li>
                    <li><strong>Market Cap:</strong> ${parseInt(stock1.marketCap) > parseInt(stock2.marketCap) ? stock1.symbol : stock2.symbol} (Larger market cap)</li>
                </ul>
            </div>
        `;
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    showNotification(title, body, icon = null) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2327ae60"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                badge: icon,
                requireInteraction: true,
                actions: [
                    { action: 'view', title: 'View Details' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            });

            notification.onclick = function() {
                window.focus();
                notification.close();
            };

            setTimeout(() => {
                notification.close();
            }, 10000);
        }
    }

    startAlertChecking() {
        setInterval(() => {
            this.checkAlerts();
        }, 60000);
    }

    checkAlerts() {
        this.alerts.forEach((alert, index) => {
            const mockData = this.generateMockStockData(alert.symbol);
            const currentPrice = parseFloat(mockData.price);
            const targetPrice = alert.targetPrice;

            const priceDiff = Math.abs(currentPrice - targetPrice);
            const percentDiff = (priceDiff / targetPrice) * 100;

            if (percentDiff <= 2) {
                this.showNotification(
                    `Price Alert: ${alert.symbol}`,
                    `${alert.symbol} is trading at $${currentPrice.toFixed(2)}, close to your target of $${targetPrice.toFixed(2)}`
                );

                this.alerts[index].triggered = true;
                this.alerts[index].triggerDate = new Date().toISOString();
                this.saveAlerts();
            }
        });
    }

    clearTriggeredAlerts() {
        this.alerts = this.alerts.filter(alert => !alert.triggered);
        this.saveAlerts();
        this.loadAlerts();
    }

    showStorageUsage() {
        const usage = this.getStorageUsage();
        const usageKB = (usage.total / 1024).toFixed(2);

        let breakdown = 'Storage Usage Breakdown:\n\n';
        for (const [key, size] of Object.entries(usage.breakdown)) {
            breakdown += `${key}: ${(size / 1024).toFixed(2)} KB\n`;
        }

        alert(`Total Storage Used: ${usageKB} KB\n\n${breakdown}`);
    }
}

const app = new StockScope();
class StockScope {
    constructor() {
        this.portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
        this.alerts = JSON.parse(localStorage.getItem('alerts')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadPortfolio();
        this.loadAlerts();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('search-btn');
        const symbolInput = document.getElementById('symbol-input');
        const addAlertBtn = document.getElementById('add-alert');

        searchBtn.addEventListener('click', () => this.searchStock());
        symbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchStock();
        });

        if (addAlertBtn) {
            addAlertBtn.addEventListener('click', () => this.addAlert());
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
                    <button onclick="app.removeFromPortfolio(${index})">Remove</button>
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
            alertsHTML += `
                <div class="stock-card">
                    <h4>${alert.symbol}</h4>
                    <p><strong>Target Price:</strong> $${alert.targetPrice.toFixed(2)}</p>
                    <p><strong>Created:</strong> ${new Date(alert.dateCreated).toLocaleDateString()}</p>
                    <button onclick="app.removeAlert(${index})">Remove Alert</button>
                </div>
            `;
        });

        alertList.innerHTML = alertsHTML;
    }

    removeAlert(index) {
        this.alerts.splice(index, 1);
        this.saveAlerts();
        this.loadAlerts();
    }

    savePortfolio() {
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
    }

    saveAlerts() {
        localStorage.setItem('alerts', JSON.stringify(this.alerts));
    }
}

const app = new StockScope();
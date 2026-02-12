// =====================================================
//  FINANCIAL MANAGEMENT - JavaScript with CRUD
// =====================================================

// API Base URL - Update this with your InfinityFree URL
const API_BASE_URL = 'https://yourdomain.infinityfreeapp.com/api_transactions.php';

// Initialize Financial Management when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Financial Management nav link
    const financialNavLink = document.querySelector('.nav-link[data-page="financial"]');
    if (financialNavLink) {
        financialNavLink.addEventListener('click', function() {
            setTimeout(() => {
                loadFinancialData();
            }, 100);
        });
    }
    
    // Load data on initial page load if on financial page
    if (window.location.hash === '#financial' || document.querySelector('.page[data-page="financial"]')?.classList.contains('active')) {
        loadFinancialData();
    }
});

// =====================================================
// LOAD ALL FINANCIAL DATA
// =====================================================
function loadFinancialData() {
    loadRevenueDashboard();
    loadRevenueByVehicle();
    loadRevenueStats();
    loadTransactionHistory();
    loadPaymentMethods();
}

// =====================================================
// DASHBOARD - Load Revenue Dashboard
// =====================================================
function loadRevenueDashboard() {
    fetch(`${API_BASE_URL}?action=dashboard`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('fmDailyEarnings').textContent = formatCurrency(data.data.daily);
                document.getElementById('fmWeeklyEarnings').textContent = formatCurrency(data.data.weekly);
                document.getElementById('fmMonthlyEarnings').textContent = formatCurrency(data.data.monthly);
            }
        })
        .catch(error => {
            console.error('Error loading dashboard:', error);
            showNotification('Failed to load dashboard data', 'error');
        });
}

// =====================================================
// READ - Load Revenue by Vehicle
// =====================================================
function loadRevenueByVehicle() {
    fetch(`${API_BASE_URL}?action=revenue`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('revenueByVehicleBody');
                tbody.innerHTML = '';
                
                data.data.forEach(vehicle => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${vehicle.vehicle_plate}</strong></td>
                        <td>${vehicle.route}</td>
                        <td>${formatCurrency(vehicle.daily_revenue)}</td>
                        <td>${formatCurrency(vehicle.monthly_revenue)}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        })
        .catch(error => {
            console.error('Error loading revenue by vehicle:', error);
        });
}

// =====================================================
// STATS - Load Revenue Statistics
// =====================================================
function loadRevenueStats() {
    fetch(`${API_BASE_URL}?action=stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('fmTotalTrips').textContent = data.data.total_trips.toLocaleString();
                document.getElementById('fmAvgFare').textContent = `₱ ${data.data.avg_fare}`;
                document.getElementById('fmTopDriver').textContent = data.data.top_driver;
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

// =====================================================
// READ - Load Transaction History
// =====================================================
function loadTransactionHistory() {
    fetch(`${API_BASE_URL}?action=readAll&limit=50`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('transactionHistoryBody');
                tbody.innerHTML = '';
                
                data.data.forEach(txn => {
                    const row = document.createElement('tr');
                    const statusClass = txn.status === 'completed' ? 'completed' : 
                                       txn.status === 'pending' ? 'pending' : 'failed';
                    
                    row.innerHTML = `
                        <td><strong>${txn.transaction_code}</strong></td>
                        <td>${txn.transaction_date}</td>
                        <td>${txn.vehicle_plate}</td>
                        <td>${txn.driver_name}</td>
                        <td><strong>${formatCurrency(txn.amount)}</strong></td>
                        <td>${txn.payment_method}</td>
                        <td><span class="status-badge ${statusClass}">${txn.status}</span></td>
                        <td>
                            <button class="js-btn-icon" onclick="viewTransaction(${txn.transaction_id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="js-btn-icon" onclick="openEditModal(${txn.transaction_id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="js-btn-icon" onclick="deleteTransactionConfirm(${txn.transaction_id}, '${txn.transaction_code}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            showNotification('Failed to load transactions', 'error');
        });
}

// =====================================================
// READ - Load Payment Methods
// =====================================================
function loadPaymentMethods() {
    fetch(`${API_BASE_URL}?action=payments`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById('paymentMethodsGrid');
                container.innerHTML = '';
                
                data.data.forEach((method, index) => {
                    const card = document.createElement('div');
                    card.className = 'payment-method-card';
                    if (index === 0) card.classList.add('active');
                    
                    card.innerHTML = `
                        <div class="payment-icon">
                            <i class="fas ${method.icon_class}"></i>
                        </div>
                        <div class="payment-name">${method.payment_method}</div>
                        <div class="payment-count">${method.transaction_count} transactions (${method.percentage}%)</div>
                    `;
                    container.appendChild(card);
                });
            }
        })
        .catch(error => {
            console.error('Error loading payment methods:', error);
        });
}

// =====================================================
// CREATE - Add New Transaction
// =====================================================
function openAddTransactionModal() {
    const modalHTML = `
        <div id="transactionModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Transaction</h2>
                    <span class="close" onclick="closeModal('transactionModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="transactionForm">
                        <div class="form-group">
                            <label>Transaction Date*</label>
                            <input type="date" id="txnDate" required value="${getCurrentDate()}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Vehicle Plate*</label>
                                <input type="text" id="txnVehicle" required placeholder="ABC-1234">
                            </div>
                            <div class="form-group">
                                <label>Driver ID*</label>
                                <input type="number" id="txnDriverId" required placeholder="1">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Driver Name*</label>
                            <input type="text" id="txnDriverName" required placeholder="Juan Dela Cruz">
                        </div>
                        
                        <div class="form-group">
                            <label>Route*</label>
                            <input type="text" id="txnRoute" required placeholder="Cubao-Divisoria">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount (₱)*</label>
                                <input type="number" step="0.01" id="txnAmount" required placeholder="2450.00">
                            </div>
                            <div class="form-group">
                                <label>Trip Count*</label>
                                <input type="number" id="txnTripCount" required placeholder="64">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Fare per Trip (₱)</label>
                            <input type="number" step="0.01" id="txnFarePerTrip" placeholder="38.50">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Payment Method*</label>
                                <select id="txnPaymentMethod" required>
                                    <option value="Cash">Cash</option>
                                    <option value="GCash">GCash</option>
                                    <option value="PayMaya">PayMaya</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status*</label>
                                <select id="txnStatus" required>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="txnNotes" rows="3" placeholder="Additional notes..."></textarea>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="closeModal('transactionModal')">Cancel</button>
                            <button type="submit" class="btn-primary">Create Transaction</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('transactionModal').style.display = 'block';
    
    // Form submit handler
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createTransaction();
    });
}

function createTransaction() {
    const transactionData = {
        transaction_date: document.getElementById('txnDate').value,
        vehicle_plate: document.getElementById('txnVehicle').value,
        driver_id: parseInt(document.getElementById('txnDriverId').value),
        driver_name: document.getElementById('txnDriverName').value,
        route: document.getElementById('txnRoute').value,
        amount: parseFloat(document.getElementById('txnAmount').value),
        payment_method: document.getElementById('txnPaymentMethod').value,
        status: document.getElementById('txnStatus').value,
        trip_count: parseInt(document.getElementById('txnTripCount').value),
        fare_per_trip: parseFloat(document.getElementById('txnFarePerTrip').value) || 0,
        notes: document.getElementById('txnNotes').value
    };
    
    fetch(`${API_BASE_URL}?action=create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Transaction created successfully!', 'success');
            closeModal('transactionModal');
            loadTransactionHistory();
            loadRevenueDashboard();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error creating transaction:', error);
        showNotification('Failed to create transaction', 'error');
    });
}

// =====================================================
// UPDATE - Edit Transaction
// =====================================================
function openEditModal(transactionId) {
    // Fetch transaction data first
    fetch(`${API_BASE_URL}?action=readOne&id=${transactionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const txn = data.data;
                showEditModal(txn);
            }
        })
        .catch(error => {
            console.error('Error fetching transaction:', error);
            showNotification('Failed to load transaction data', 'error');
        });
}

function showEditModal(txn) {
    const modalHTML = `
        <div id="editTransactionModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Transaction - ${txn.transaction_code}</h2>
                    <span class="close" onclick="closeModal('editTransactionModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editTransactionForm">
                        <input type="hidden" id="editTxnId" value="${txn.transaction_id}">
                        
                        <div class="form-group">
                            <label>Transaction Date*</label>
                            <input type="date" id="editTxnDate" required value="${txn.transaction_date}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Vehicle Plate*</label>
                                <input type="text" id="editTxnVehicle" required value="${txn.vehicle_plate}">
                            </div>
                            <div class="form-group">
                                <label>Driver ID*</label>
                                <input type="number" id="editTxnDriverId" required value="${txn.driver_id}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Driver Name*</label>
                            <input type="text" id="editTxnDriverName" required value="${txn.driver_name}">
                        </div>
                        
                        <div class="form-group">
                            <label>Route*</label>
                            <input type="text" id="editTxnRoute" required value="${txn.route}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount (₱)*</label>
                                <input type="number" step="0.01" id="editTxnAmount" required value="${txn.amount}">
                            </div>
                            <div class="form-group">
                                <label>Trip Count*</label>
                                <input type="number" id="editTxnTripCount" required value="${txn.trip_count}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Fare per Trip (₱)</label>
                            <input type="number" step="0.01" id="editTxnFarePerTrip" value="${txn.fare_per_trip}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Payment Method*</label>
                                <select id="editTxnPaymentMethod" required>
                                    <option value="Cash" ${txn.payment_method === 'Cash' ? 'selected' : ''}>Cash</option>
                                    <option value="GCash" ${txn.payment_method === 'GCash' ? 'selected' : ''}>GCash</option>
                                    <option value="PayMaya" ${txn.payment_method === 'PayMaya' ? 'selected' : ''}>PayMaya</option>
                                    <option value="Bank Transfer" ${txn.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status*</label>
                                <select id="editTxnStatus" required>
                                    <option value="completed" ${txn.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="pending" ${txn.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="failed" ${txn.status === 'failed' ? 'selected' : ''}>Failed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="editTxnNotes" rows="3">${txn.notes || ''}</textarea>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="closeModal('editTransactionModal')">Cancel</button>
                            <button type="submit" class="btn-primary">Update Transaction</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('editTransactionModal').style.display = 'block';
    
    // Form submit handler
    document.getElementById('editTransactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateTransaction();
    });
}

function updateTransaction() {
    const transactionData = {
        transaction_id: parseInt(document.getElementById('editTxnId').value),
        transaction_date: document.getElementById('editTxnDate').value,
        vehicle_plate: document.getElementById('editTxnVehicle').value,
        driver_id: parseInt(document.getElementById('editTxnDriverId').value),
        driver_name: document.getElementById('editTxnDriverName').value,
        route: document.getElementById('editTxnRoute').value,
        amount: parseFloat(document.getElementById('editTxnAmount').value),
        payment_method: document.getElementById('editTxnPaymentMethod').value,
        status: document.getElementById('editTxnStatus').value,
        trip_count: parseInt(document.getElementById('editTxnTripCount').value),
        fare_per_trip: parseFloat(document.getElementById('editTxnFarePerTrip').value) || 0,
        notes: document.getElementById('editTxnNotes').value
    };
    
    fetch(`${API_BASE_URL}?action=update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Transaction updated successfully!', 'success');
            closeModal('editTransactionModal');
            loadTransactionHistory();
            loadRevenueDashboard();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating transaction:', error);
        showNotification('Failed to update transaction', 'error');
    });
}

// =====================================================
// DELETE - Delete Transaction
// =====================================================
function deleteTransactionConfirm(transactionId, transactionCode) {
    if (confirm(`Are you sure you want to delete transaction ${transactionCode}? This action cannot be undone.`)) {
        deleteTransaction(transactionId);
    }
}

function deleteTransaction(transactionId) {
    fetch(`${API_BASE_URL}?action=delete&id=${transactionId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Transaction deleted successfully!', 'success');
            loadTransactionHistory();
            loadRevenueDashboard();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting transaction:', error);
        showNotification('Failed to delete transaction', 'error');
    });
}

// =====================================================
// VIEW - View Transaction Details
// =====================================================
function viewTransaction(transactionId) {
    fetch(`${API_BASE_URL}?action=readOne&id=${transactionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const txn = data.data;
                showViewModal(txn);
            }
        })
        .catch(error => {
            console.error('Error fetching transaction:', error);
            showNotification('Failed to load transaction details', 'error');
        });
}

function showViewModal(txn) {
    const statusClass = txn.status === 'completed' ? 'completed' : 
                       txn.status === 'pending' ? 'pending' : 'failed';
    
    const modalHTML = `
        <div id="viewTransactionModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Transaction Details</h2>
                    <span class="close" onclick="closeModal('viewTransactionModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="transaction-details">
                        <div class="detail-row">
                            <span class="detail-label">Transaction Code:</span>
                            <span class="detail-value"><strong>${txn.transaction_code}</strong></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">${txn.transaction_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Vehicle Plate:</span>
                            <span class="detail-value">${txn.vehicle_plate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Driver:</span>
                            <span class="detail-value">${txn.driver_name} (ID: ${txn.driver_id})</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Route:</span>
                            <span class="detail-value">${txn.route}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount:</span>
                            <span class="detail-value"><strong>${formatCurrency(txn.amount)}</strong></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Trip Count:</span>
                            <span class="detail-value">${txn.trip_count} trips</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Fare per Trip:</span>
                            <span class="detail-value">${formatCurrency(txn.fare_per_trip)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment Method:</span>
                            <span class="detail-value">${txn.payment_method}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value"><span class="status-badge ${statusClass}">${txn.status}</span></span>
                        </div>
                        ${txn.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">Notes:</span>
                            <span class="detail-value">${txn.notes}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="detail-label">Created At:</span>
                            <span class="detail-value">${txn.created_at}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Updated At:</span>
                            <span class="detail-value">${txn.updated_at}</span>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="closeModal('viewTransactionModal')">Close</button>
                        <button type="button" class="btn-primary" onclick="closeModal('viewTransactionModal'); openEditModal(${txn.transaction_id})">Edit</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('viewTransactionModal').style.display = 'block';
}

// =====================================================
// FILTER Transactions
// =====================================================
function filterTransactions() {
    const filterData = {
        dateFrom: document.getElementById('filterDateFrom').value,
        dateTo: document.getElementById('filterDateTo').value,
        status: document.getElementById('filterStatus').value,
        vehicle: document.getElementById('filterVehicle')?.value || '',
        payment_method: document.getElementById('filterPaymentMethod')?.value || ''
    };
    
    fetch(`${API_BASE_URL}?action=filter`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filterData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const tbody = document.getElementById('transactionHistoryBody');
            tbody.innerHTML = '';
            
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No transactions found</td></tr>';
                return;
            }
            
            data.data.forEach(txn => {
                const row = document.createElement('tr');
                const statusClass = txn.status === 'completed' ? 'completed' : 
                                   txn.status === 'pending' ? 'pending' : 'failed';
                
                row.innerHTML = `
                    <td><strong>${txn.transaction_code}</strong></td>
                    <td>${txn.transaction_date}</td>
                    <td>${txn.vehicle_plate}</td>
                    <td>${txn.driver_name}</td>
                    <td><strong>${formatCurrency(txn.amount)}</strong></td>
                    <td>${txn.payment_method}</td>
                    <td><span class="status-badge ${statusClass}">${txn.status}</span></td>
                    <td>
                        <button class="js-btn-icon" onclick="viewTransaction(${txn.transaction_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="js-btn-icon" onclick="openEditModal(${txn.transaction_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="js-btn-icon" onclick="deleteTransactionConfirm(${txn.transaction_id}, '${txn.transaction_code}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            showNotification(`Found ${data.data.length} transactions`, 'success');
        }
    })
    .catch(error => {
        console.error('Error filtering transactions:', error);
        showNotification('Failed to filter transactions', 'error');
    });
}

// Clear filters
function clearFilters() {
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterStatus').value = 'all';
    if (document.getElementById('filterVehicle')) {
        document.getElementById('filterVehicle').value = '';
    }
    if (document.getElementById('filterPaymentMethod')) {
        document.getElementById('filterPaymentMethod').value = 'all';
    }
    loadTransactionHistory();
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Format currency
function formatCurrency(amount) {
    return '₱ ' + parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Get current date
function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Export report (placeholder)
function exportFinancialReport() {
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    
    showNotification(`Exporting ${reportType} report from ${dateFrom} to ${dateTo}...`, 'info');
    
    // Implement actual export logic here
    // You can generate CSV, PDF, or Excel files
}

// Chart period selector
function selectChartPeriod(period) {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    console.log('Selected period:', period);
    // Implement chart data reload based on period
}

// Generate summary report
function generateSummaryReport() {
    const reportType = document.getElementById('summaryReportType').value;
    showNotification(`Generating ${reportType} summary report...`, 'info');
    // Implement report generation
}
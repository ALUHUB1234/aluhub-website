// Admin Password
const ADMIN_PASSWORD = "AluHub@123";

// Check if user is logged in
function checkAuth() {
    return localStorage.getItem('aluhub_auth') === 'true';
}

// Login function
function login() {
    const password = document.getElementById('password').value;
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('aluhub_auth', 'true');
        showAdminContent();
    } else {
        alert('Incorrect password! Please try again.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('aluhub_auth');
    window.location.href = 'admin.html';
}

// Show admin content
function showAdminContent() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    loadAdvances();
    updateStats();
}

// Load all advances from localStorage
function loadAdvances() {
    const advances = getAdvances();
    const tbody = document.getElementById('advancesBody');
    tbody.innerHTML = '';
    
    advances.forEach((advance, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${advance.staffName}</td>
            <td>${formatDate(advance.date)}</td>
            <td>${advance.purpose}</td>
            <td>₹${advance.amount.toLocaleString()}</td>
            <td>${advance.remarks || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editAdvance(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteAdvance(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateStaffSummary();
    updateStats();
}

// Get all advances from localStorage
function getAdvances() {
    const advances = localStorage.getItem('aluhub_advances');
    return advances ? JSON.parse(advances) : [];
}

// Save advances to localStorage
function saveAdvances(advances) {
    localStorage.setItem('aluhub_advances', JSON.stringify(advances));
}

// Add new advance
function addAdvance(event) {
    event.preventDefault();
    
    const advance = {
        staffName: document.getElementById('staffName').value.trim(),
        date: document.getElementById('advanceDate').value,
        purpose: document.getElementById('purpose').value,
        amount: parseFloat(document.getElementById('amount').value),
        remarks: document.getElementById('remarks').value.trim(),
        timestamp: new Date().toISOString()
    };
    
    if (!advance.staffName || !advance.date || !advance.purpose || !advance.amount) {
        alert('Please fill all required fields!');
        return;
    }
    
    const advances = getAdvances();
    advances.push(advance);
    saveAdvances(advances);
    
    // Reset form
    document.getElementById('salaryAdvanceForm').reset();
    document.getElementById('advanceForm').style.display = 'none';
    
    // Reload data
    loadAdvances();
    updateStats();
}

// Delete advance
function deleteAdvance(index) {
    if (confirm('Are you sure you want to delete this advance?')) {
        const advances = getAdvances();
        advances.splice(index, 1);
        saveAdvances(advances);
        loadAdvances();
        updateStats();
    }
}

// Edit advance
function editAdvance(index) {
    const advances = getAdvances();
    const advance = advances[index];
    
    // Populate form
    document.getElementById('staffName').value = advance.staffName;
    document.getElementById('advanceDate').value = advance.date;
    document.getElementById('purpose').value = advance.purpose;
    document.getElementById('amount').value = advance.amount;
    document.getElementById('remarks').value = advance.remarks;
    
    // Show form
    document.getElementById('advanceForm').style.display = 'block';
    
    // Update form submit handler
    const form = document.getElementById('salaryAdvanceForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        // Update advance
        advances[index] = {
            ...advance,
            staffName: document.getElementById('staffName').value.trim(),
            date: document.getElementById('advanceDate').value,
            purpose: document.getElementById('purpose').value,
            amount: parseFloat(document.getElementById('amount').value),
            remarks: document.getElementById('remarks').value.trim()
        };
        
        saveAdvances(advances);
        form.reset();
        document.getElementById('advanceForm').style.display = 'none';
        loadAdvances();
        updateStats();
    };
}

// Update statistics
function updateStats() {
    const advances = getAdvances();
    
    // Calculate total amount
    const totalAmount = advances.reduce((sum, advance) => sum + advance.amount, 0);
    
    // Get unique staff count
    const uniqueStaff = [...new Set(advances.map(a => a.staffName))];
    
    // Calculate this month's total
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTotal = advances.reduce((sum, advance) => {
        const advanceDate = new Date(advance.date);
        if (advanceDate.getMonth() === currentMonth && 
            advanceDate.getFullYear() === currentYear) {
            return sum + advance.amount;
        }
        return sum;
    }, 0);
    
    // Update display
    document.getElementById('totalAmount').textContent = `₹${totalAmount.toLocaleString()}`;
    document.getElementById('totalStaff').textContent = uniqueStaff.length;
    document.getElementById('monthlyTotal').textContent = `₹${monthlyTotal.toLocaleString()}`;
}

// Update staff-wise summary
function updateStaffSummary() {
    const advances = getAdvances();
    const summary = {};
    
    // Calculate totals per staff
    advances.forEach(advance => {
        if (!summary[advance.staffName]) {
            summary[advance.staffName] = 0;
        }
        summary[advance.staffName] += advance.amount;
    });
    
    // Display summary
    const summaryContainer = document.getElementById('staffSummary');
    summaryContainer.innerHTML = '';
    
    Object.entries(summary).forEach(([staffName, total]) => {
        const card = document.createElement('div');
        card.className = 'staff-card';
        card.innerHTML = `
            <h4>${staffName}</h4>
            <p>Total Advances: <span class="staff-total">₹${total.toLocaleString()}</span></p>
            <p>Last Advance: ${getLastAdvanceDate(staffName, advances)}</p>
        `;
        summaryContainer.appendChild(card);
    });
}

// Get last advance date for a staff
function getLastAdvanceDate(staffName, advances) {
    const staffAdvances = advances
        .filter(a => a.staffName === staffName)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return staffAdvances.length > 0 ? formatDate(staffAdvances[0].date) : 'No advances';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#advancesBody tr');
        
        rows.forEach(row => {
            const staffName = row.cells[1].textContent.toLowerCase();
            row.style.display = staffName.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Export data to CSV
function exportToCSV() {
    const advances = getAdvances();
    if (advances.length === 0) {
        alert('No data to export!');
        return;
    }
    
    // Create CSV content
    const headers = ['Staff Name', 'Date', 'Purpose', 'Amount', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...advances.map(advance => [
            `"${advance.staffName}"`,
            `"${formatDate(advance.date)}"`,
            `"${advance.purpose}"`,
            advance.amount,
            `"${advance.remarks || ''}"`
        ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aluhub-advances-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on admin page
    if (document.getElementById('loginContainer')) {
        if (checkAuth()) {
            showAdminContent();
        } else {
            // Setup login button
            document.getElementById('loginBtn').addEventListener('click', login);
            
            // Allow Enter key to login
            document.getElementById('password').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login();
                }
            });
        }
        
        // Setup other event listeners for admin page
        if (checkAuth()) {
            document.getElementById('addAdvanceBtn').addEventListener('click', function() {
                document.getElementById('advanceForm').style.display = 'block';
                document.getElementById('salaryAdvanceForm').reset();
                document.getElementById('salaryAdvanceForm').onsubmit = addAdvance;
            });
            
            document.getElementById('cancelBtn').addEventListener('click', function() {
                document.getElementById('advanceForm').style.display = 'none';
                document.getElementById('salaryAdvanceForm').reset();
            });
            
            document.getElementById('exportBtn').addEventListener('click', exportToCSV);
            document.getElementById('logoutBtn').addEventListener('click', logout);
            
            setupSearch();
            
            // Set default date to today
            document.getElementById('advanceDate').valueAsDate = new Date();
        }
    }
    
    // Smooth scrolling for homepage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
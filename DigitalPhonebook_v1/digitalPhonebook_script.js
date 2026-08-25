(function() {
    "use strict";

    // ================================================================
    // GOOGLE SHEETS CONFIGURATION (HARDCODED)
    // ================================================================
    // Replace these values with your actual credentials
    // ================================================================

    const GOOGLE_SHEETS_CONFIG = {
        // Your API Key from Google Cloud Console
        apiKey: 'AIzaSyA0TYmuemvmL_5fFVEvBorhS-h8d3QP9OI',
        
        // Your Spreadsheet ID from the URL
        spreadsheetId: '1zGvaKKwjt-S7ve_YW1B5a1YMCWof6d_KdNqR0kHt4dw',
        
        // Sheet name (default is "Sheet1")
        sheetName: 'Sheet1',
        
        // Column mapping (A=Office, B=Local)
        range: 'A:B'
    };

    // ================================================================
    // END OF CONFIGURATION
    // ================================================================

    // ----- STATE -----
    let phonebook = [];
    let isConnected = false;

    // DOM refs
    const container = document.getElementById('entriesContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const statusText = document.getElementById('statusText');
    const entryCount = document.getElementById('entryCount');

    // ----- STATUS UPDATES -----
    function setStatus(msg, type = 'info') {
        statusText.textContent = msg;
        statusText.className = 'status-text ' + type;
    }

    function updateEntryCount() {
        entryCount.textContent = phonebook.length + ' entries loaded';
    }

    // ----- GOOGLE SHEETS API -----
    async function readFromSheets() {
        try {
            const { apiKey, spreadsheetId, sheetName, range } = GOOGLE_SHEETS_CONFIG;
            const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + sheetName + '!' + range + '?key=' + apiKey;
            
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to read sheet');
            }
            
            const data = await response.json();
            const values = data.values || [];
            
            // ALWAYS skip the first row (header)
            const entries = [];
            for (let i = 1; i < values.length; i++) {
                const row = values[i];
                if (row.length >= 2 && row[0] && row[1]) {
                    entries.push({
                        office: String(row[0]).trim(),
                        local: String(row[1]).trim()
                    });
                }
            }
            
            return entries;
        } catch (error) {
            console.error('Read error:', error);
            throw error;
        }
    }

    // ----- LOAD FROM GOOGLE SHEETS -----
    async function loadFromSheets() {
        try {
            setStatus('Loading...', 'loading');
            const entries = await readFromSheets();
            
            if (entries.length === 0) {
                phonebook = [
                    { office: 'Main Office', local: '101' },
                    { office: 'HR Department', local: '202' },
                    { office: 'IT Support', local: '303' },
                    { office: 'Reception', local: '100' },
                    { office: 'Sales Team', local: '404' },
                    { office: 'Marketing', local: '505' }
                ];
                setStatus('Using sample data', 'info');
            } else {
                phonebook = entries;
                setStatus('Ready', 'success');
            }
            
            isConnected = true;
            render();
            updateEntryCount();
            return true;
        } catch (error) {
            setStatus('Error: ' + error.message, 'error');
            return false;
        }
    }

    // ----- RENDER (with search filter) -----
    function render() {
        const query = searchInput.value.trim().toLowerCase();
        let filtered = phonebook;
        if (query !== '') {
            filtered = phonebook.filter(function(entry) {
                return entry.office.toLowerCase().includes(query) ||
                       entry.local.toLowerCase().includes(query);
            });
        }

        container.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-msg';
            empty.textContent = (phonebook.length === 0) ?
                'No entries found.' :
                'No results match your search.';
            container.appendChild(empty);
            updateEntryCount();
            return;
        }

        filtered.forEach(function(entry) {
            const div = document.createElement('div');
            div.className = 'entry-item';
            
            const infoSpan = document.createElement('span');
            infoSpan.innerHTML = '<span class="entry-office">' + escapeHtml(entry.office) + '</span>  —  <span class="entry-local">' + escapeHtml(entry.local) + '</span>';
            div.appendChild(infoSpan);
            
            container.appendChild(div);
        });
        updateEntryCount();
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // ----- EVENT BINDING -----
    searchInput.addEventListener('input', render);
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        render();
    });

    // Auto-refresh every 30 seconds (optional)
    setInterval(function() {
        if (isConnected) {
            loadFromSheets();
        }
    }, 30000);

    // ----- START -----
    loadFromSheets();

    // Expose for debugging
    window.__phonebook = phonebook;
    window.__load = loadFromSheets;

})();
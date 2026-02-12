// =====================================================
// ECOBEEP NAVIGATION FIX - HANDLES MISSING PAGES
// =====================================================

(function() {
    'use strict';
    
    console.log('🚌 EcoBeep Navigation Fix Loading...');
    
    function initNavigation() {
        console.log('📍 Initializing navigation...');
        
        // 1. Fix Jeep dropdown
        fixJeepDropdown();
        
        // 2. Fix page navigation
        fixPageNavigation();
        
        console.log('✅ Navigation ready!');
    }
    
    function fixJeepDropdown() {
        console.log('📂 Fixing Jeep Management dropdown...');
        
        const jeepToggle = document.querySelector('.jeep-toggle');
        const jeepSubmenu = document.getElementById('jeepSubmenu');
        
        if (!jeepToggle || !jeepSubmenu) {
            console.error('❌ Dropdown elements not found');
            return;
        }
        
        console.log('✅ Found dropdown elements');
        
        // Remove old listeners by cloning
        const newToggle = jeepToggle.cloneNode(true);
        jeepToggle.parentNode.replaceChild(newToggle, jeepToggle);
        
        // Add click handler
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle submenu
            const isActive = jeepSubmenu.classList.toggle('active');
            
            // Toggle parent active state
            this.classList.toggle('active');
            
            // Rotate chevron
            const chevron = this.querySelector('.chevron');
            if (chevron) {
                chevron.classList.toggle('rotated');
            }
            
            // Toggle parent li open state
            const parentLi = this.closest('li');
            if (parentLi) {
                parentLi.classList.toggle('open');
            }
            
            console.log(isActive ? '📂 Opened dropdown' : '📁 Closed dropdown');
        });
        
        // Handle submenu item clicks
        const submenuLinks = jeepSubmenu.querySelectorAll('.nav-link');
        submenuLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent closing dropdown
                console.log('Submenu item clicked:', this.getAttribute('data-page'));
            });
        });
        
        console.log('✅ Dropdown fixed');
    }
    
    function fixPageNavigation() {
        console.log('🔍 Verifying pages exist...');
        
        const expectedPages = [
            'page-home',
            'page-vehicle-details',
            'page-jeep-status',
            'page-driver-mgmt',
            'page-route-mgmt',
            'page-scheduling',
            'page-account'
        ];
        
        expectedPages.forEach(function(pageId) {
            const page = document.getElementById(pageId);
            if (page) {
                console.log(`   ✅ ${pageId}`);
            } else {
                console.log(`   ⚠️ MISSING: ${pageId}`);
            }
        });
        
        console.log('📄 Fixing page navigation...');
        
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        console.log(`   Found ${navLinks.length} navigation links`);
        
        // Remove old listeners by cloning
        navLinks.forEach(function(link) {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        // Add new listeners
        const freshLinks = document.querySelectorAll('.nav-link[data-page]');
        
        freshLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const pageName = this.getAttribute('data-page');
                console.log(`🔘 Clicked: ${pageName}`);
                
                navigateToPage(pageName, this);
            });
        });
        
        console.log('✅ Page navigation fixed');
    }
    
    function navigateToPage(pageName, clickedLink) {
        console.log(`📄 Navigating to: ${pageName}`);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(function(page) {
            page.classList.remove('active');
            page.style.display = 'none';
        });
        
        // Show target page
        const targetPageId = 'page-' + pageName;
        const targetPage = document.getElementById(targetPageId);
        
        if (!targetPage) {
            console.error(`❌ Page not found: ${targetPageId}`);
            
            // Show a user-friendly message
            alert('Page "' + pageName + '" is not available yet.\n\nPlease check the console for details.');
            
            // Try to show home page instead
            const homePage = document.getElementById('page-home');
            if (homePage) {
                homePage.classList.add('active');
                homePage.style.display = 'block';
                console.log('↩️ Showing home page instead');
            }
            return;
        }
        
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
        console.log(`✅ Showing: ${targetPageId}`);
        
        // Update active states
        document.querySelectorAll('.nav-link').forEach(function(nav) {
            nav.classList.remove('active');
        });
        
        if (clickedLink) {
            clickedLink.classList.add('active');
            
            // Keep parent active if submenu
            if (clickedLink.closest('.submenu')) {
                const parent = document.querySelector('.jeep-toggle');
                if (parent) parent.classList.add('active');
            }
        }
        
        // Load page data (with error handling)
        loadPageData(pageName);
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    function loadPageData(pageName) {
        console.log(`📊 Loading data for: ${pageName}`);
        
        const dataFunctions = {
            'vehicle-details': 'loadVehicleData',
            'jeep-status': 'loadJeepStatusData',
            'driver-mgmt': 'loadDriverManagementData',
            'route-mgmt': 'loadRouteManagementData',
            'scheduling': 'loadSchedulingData'
        };
        
        const functionName = dataFunctions[pageName];
        
        if (!functionName) {
            console.log(`   ℹ️ No data function for ${pageName}`);
            return;
        }
        
        if (typeof window[functionName] !== 'function') {
            console.warn(`   ⚠️ Function ${functionName} not found - will skip data loading`);
            return;
        }
        
        try {
            window[functionName]();
            console.log(`   ✅ Called ${functionName}()`);
        } catch (error) {
            console.error(`   ❌ Error calling ${functionName}:`, error);
        }
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }
    
    // Debug function
    window.debugNav = function() {
        console.log('=== NAVIGATION DEBUG ===');
        console.log('Nav links:', document.querySelectorAll('.nav-link[data-page]').length);
        console.log('Total pages:', document.querySelectorAll('.page').length);
        console.log('Active page:', document.querySelector('.page.active')?.id || 'None');
        console.log('\nAll pages:');
        document.querySelectorAll('.page').forEach(function(p) {
            console.log(`  ${p.id}: ${p.classList.contains('active') ? 'ACTIVE' : 'hidden'}`);
        });
    };
    
    console.log('💡 Type debugNav() in console for debug info');
    
})();
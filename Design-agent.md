<!DOCTYPE html>
<html lang="th" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FundFlow | Smart Portfolio</title>
    
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Icons (Lucide) -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Tailwind Config for Revolut x TasteSkill -->
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        'canvas-dark': '#000000',
                        'canvas-light': '#ffffff',
                        'surface-soft': '#f4f4f4',
                        'surface-card': '#ffffff',
                        'surface-elevated': '#16181a',
                        'primary': '#494fdf',
                        'primary-deep': '#3a40c4',
                        'ink': '#191c1f',
                        'mute': '#505a63',
                        'on-dark': '#ffffff',
                        'on-dark-mute': 'rgba(255,255,255,0.72)',
                        'hairline-light': '#e2e2e7',
                        'hairline-dark': 'rgba(255,255,255,0.12)',
                        'accent-warning': '#ec7e00',
                        'accent-success': '#00a87e',
                        'accent-danger': '#e23b4a'
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    borderRadius: {
                        'revo-card': '20px',
                        'revo-input': '12px',
                    },
                    spacing: {
                        'section': '88px',
                        'band': '120px',
                    },
                    animation: {
                        'reveal-up': 'revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    },
                    keyframes: {
                        revealUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        }
                    }
                }
            }
        }
    </script>

    <style>
        /* Typography System - Revolut Sharpness */
        .display-hero {
            font-weight: 500;
            line-height: 1.0;
            letter-spacing: -0.04em;
        }
        .display-section {
            font-weight: 500;
            line-height: 1.05;
            letter-spacing: -0.03em;
        }
        .body-revo {
            letter-spacing: 0.01em;
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000000; }
        ::-webkit-scrollbar-thumb { background: #3a3d40; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #505a63; }

        /* Modal Backdrop */
        .modal-backdrop {
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }

        /* Scroll Reveal Base */
        .reveal-element {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-element.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* Reduced motion fallback */
        @media (prefers-reduced-motion: reduce) {
            .reveal-element {
                opacity: 1;
                transform: none;
                transition: none;
            }
            .active\:scale-95:active {
                transform: none;
            }
        }
    </style>
</head>
<body class="font-sans antialiased bg-canvas-dark text-on-dark overflow-x-hidden body-revo selection:bg-primary selection:text-white">

    <!-- Navbar -->
    <nav class="fixed w-full z-40 bg-canvas-dark/80 backdrop-blur-md border-b border-hairline-dark h-16 flex items-center justify-between px-6 lg:px-12 transition-colors duration-300">
        <div class="flex items-center gap-8">
            <div class="font-bold text-xl tracking-tighter flex items-center gap-2">
                <div class="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                    <span class="text-white text-xs font-bold">R</span>
                </div>
                FundFlow
            </div>
            <div class="hidden md:flex gap-6 text-sm font-semibold text-on-dark-mute">
                <a href="#policies" class="hover:text-white transition-colors">Policies</a>
                <a href="#portfolios" class="hover:text-white transition-colors">Portfolios</a>
                <a href="#orders" class="hover:text-white transition-colors">Orders</a>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-on-dark-mute hidden sm:block">Customer: C001 (สมชาย)</span>
            <button class="bg-white text-canvas-dark rounded-full px-5 py-2 text-sm font-semibold hover:bg-gray-200 transition-transform active:scale-95">
                Log in
            </button>
        </div>
    </nav>

    <!-- Hero Section (Asymmetric Split, Left-aligned, Real Image) -->
    <header class="pt-24 pb-16 px-6 lg:px-12 max-w-[1400px] mx-auto min-h-[90dvh] flex flex-col lg:flex-row items-center gap-12 lg:gap-8 justify-center">
        <div class="w-full lg:w-1/2 flex flex-col items-start text-left z-10 reveal-element">
            <h1 class="display-hero text-6xl md:text-[80px] lg:text-[100px] mb-6 text-white">
                Investing.<br>Automated.
            </h1>
            <p class="text-on-dark-mute text-lg md:text-xl max-w-md mb-10 leading-relaxed">
                ระบบจัดการกองทุนอัจฉริยะ กระจายเงินลงทุนตามสัดส่วนนโยบายโดยอัตโนมัติ รวดเร็วและแม่นยำ
            </p>
            <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href="#policies" class="bg-white text-canvas-dark rounded-full px-8 py-4 text-base font-semibold hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2">
                    Explore Policies
                </a>
                <button onclick="openModal('portfolioModal')" class="bg-transparent border border-hairline-dark text-on-dark rounded-full px-8 py-4 text-base font-semibold hover:bg-white/5 transition-transform active:scale-95">
                    Open Portfolio
                </button>
            </div>
        </div>
        <div class="w-full lg:w-1/2 h-[50vh] lg:h-[70vh] relative rounded-3xl overflow-hidden reveal-element" style="transition-delay: 200ms;">
            <!-- Real placeholder image representing the platform UI / Abstract finance -->
            <img src="https://picsum.photos/seed/fintechapp/800/1000" alt="Platform preview" class="w-full h-full object-cover rounded-3xl grayscale opacity-80 hover:grayscale-0 transition-all duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-canvas-dark via-transparent to-transparent lg:bg-gradient-to-l"></div>
        </div>
    </header>

    <!-- Trust / Logo Wall (Lives under hero, strictly logos) -->
    <section class="border-y border-hairline-dark bg-canvas-dark py-12 px-6 lg:px-12">
        <div class="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 reveal-element">
            <span class="text-on-dark-mute text-sm font-medium whitespace-nowrap">Trusted by industry leaders</span>
            <div class="flex items-center gap-8 md:gap-16 opacity-50 grayscale flex-wrap justify-center">
                <!-- Using inline SVGs for logos as per requirements -->
                <svg class="h-6" viewBox="0 0 100 30" fill="currentColor"><text x="0" y="20" font-weight="bold" font-size="20">AcmeCorp</text></svg>
                <svg class="h-6" viewBox="0 0 100 30" fill="currentColor"><text x="0" y="20" font-weight="bold" font-size="20">Nexus</text></svg>
                <svg class="h-6" viewBox="0 0 100 30" fill="currentColor"><text x="0" y="20" font-weight="bold" font-size="20">Vanguard</text></svg>
                <svg class="h-6" viewBox="0 0 100 30" fill="currentColor"><text x="0" y="20" font-weight="bold" font-size="20">BlackRock</text></svg>
            </div>
        </div>
    </section>

    <!-- Policies Section (Bento Grid on Light Canvas) -->
    <section id="policies" class="bg-canvas-light text-ink py-section transition-colors duration-300">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div class="mb-16 reveal-element">
                <h2 class="display-section text-5xl md:text-[72px]">Investment Policies</h2>
            </div>
            
            <div id="policiesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Policies rendered by JS -->
            </div>
        </div>
    </section>

    <!-- Portfolios Section (Dark Canvas) -->
    <section id="portfolios" class="bg-canvas-dark text-on-dark py-section">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6 reveal-element">
                <h2 class="display-section text-5xl md:text-[72px]">Your Portfolios</h2>
                <button onclick="openModal('portfolioModal')" class="bg-primary text-white rounded-full px-6 py-3 font-semibold hover:bg-primary-deep transition-transform active:scale-95 flex items-center gap-2">
                    <i data-lucide="plus" class="w-5 h-5"></i> New Portfolio
                </button>
            </div>
            
            <div id="portfoliosGrid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Portfolios rendered by JS -->
            </div>
        </div>
    </section>

    <!-- Orders Section (Light Canvas, Data Density) -->
    <section id="orders" class="bg-canvas-light text-ink py-section">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6 reveal-element">
                <h2 class="display-section text-5xl md:text-[72px]">Transactions</h2>
                <button onclick="openModal('orderModal')" class="bg-canvas-dark text-white rounded-full px-8 py-4 font-semibold hover:bg-ink transition-transform active:scale-95 flex items-center gap-2">
                    <i data-lucide="arrow-right-left" class="w-5 h-5"></i> Place Order
                </button>
            </div>

            <div class="bg-surface-card border border-hairline-light rounded-revo-card overflow-hidden reveal-element" style="transition-delay: 100ms;">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr class="border-b border-hairline-light text-mute text-sm font-medium">
                                <th class="p-6">Order ID</th>
                                <th class="p-6">Portfolio</th>
                                <th class="p-6">Amount (THB)</th>
                                <th class="p-6">Status</th>
                                <th class="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody id="ordersTableBody">
                            <!-- Orders rendered by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    <!-- Global Footer -->
    <footer class="bg-canvas-dark text-on-dark-mute py-16 px-6 lg:px-12 border-t border-hairline-dark">
        <div class="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-2 text-white font-bold text-xl tracking-tighter">
                <div class="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                    <span class="text-white text-xs font-bold">R</span>
                </div>
                FundFlow
            </div>
            <div class="text-sm">
                &copy; 2026 Fund Management Project. Coded with React & NestJS principles.
            </div>
        </div>
    </footer>

    <!-- ================= MODALS ================= -->

    <!-- Create Portfolio Modal -->
    <div id="portfolioModal" class="fixed inset-0 z-50 hidden modal-backdrop flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-surface-card text-ink w-full max-w-md rounded-revo-card p-8 shadow-2xl transform scale-95 transition-transform duration-300">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-2xl font-bold tracking-tight">Create Portfolio</h3>
                <button onclick="closeModal('portfolioModal')" class="text-mute hover:text-ink transition-transform active:scale-90"><i data-lucide="x"></i></button>
            </div>
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-mute mb-2">Select Policy</label>
                    <div class="relative">
                        <select id="portfolioPolicySelect" class="w-full bg-surface-soft border border-transparent rounded-revo-input px-4 py-4 focus:outline-none focus:border-primary appearance-none font-medium transition-colors">
                            <!-- Options filled by JS -->
                        </select>
                        <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mute pointer-events-none"></i>
                    </div>
                </div>
                <button onclick="submitCreatePortfolio()" class="w-full bg-canvas-dark text-white rounded-full py-4 font-semibold hover:bg-ink transition-transform active:scale-95">
                    Confirm Creation
                </button>
            </div>
        </div>
    </div>

    <!-- Create Order Modal (Dark Theme matched) -->
    <div id="orderModal" class="fixed inset-0 z-50 hidden modal-backdrop flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-surface-elevated text-on-dark w-full max-w-md rounded-revo-card p-8 shadow-2xl border border-hairline-dark transform scale-95 transition-transform duration-300">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-2xl font-bold tracking-tight">Make an Investment</h3>
                <button onclick="closeModal('orderModal')" class="text-on-dark-mute hover:text-white transition-transform active:scale-90"><i data-lucide="x"></i></button>
            </div>
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-on-dark-mute mb-2">Select Portfolio</label>
                    <div class="relative">
                        <select id="orderPortfolioSelect" class="w-full bg-canvas-dark border border-hairline-dark rounded-revo-input px-4 py-4 text-white focus:outline-none focus:border-primary appearance-none font-medium transition-colors">
                            <!-- Options filled by JS -->
                        </select>
                        <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-dark-mute pointer-events-none"></i>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-on-dark-mute mb-2">Amount (THB)</label>
                    <input type="number" id="orderAmount" placeholder="e.g. 1000000" class="w-full bg-canvas-dark border border-hairline-dark rounded-revo-input px-4 py-4 text-white placeholder:text-mute focus:outline-none focus:border-primary font-medium transition-colors">
                </div>
                <button onclick="submitCreateOrder()" class="w-full bg-white text-canvas-dark rounded-full py-4 font-semibold hover:bg-gray-200 transition-transform active:scale-95">
                    Place Order
                </button>
            </div>
        </div>
    </div>

    <!-- Toast Notification Container -->
    <div id="toastContainer" class="fixed top-20 right-6 z-[60] flex flex-col gap-3"></div>

    <!-- ================= JAVASCRIPT LOGIC ================= -->
    <script>
        // --- Mock Database (Seed Data) ---
        const policies = [
            { code: 'KMASTER', name: 'นโยบายหุ้นไทย', stocks: [{code: 'PTT', weight: 40}, {code: 'SCB', weight: 35}, {code: 'CPALL', weight: 25}] },
            { code: 'TMBUSB', name: 'นโยบายตราสารหนี้', stocks: [{code: 'KBANK', weight: 50}, {code: 'BBL', weight: 50}] },
            { code: 'SCBDV', name: 'นโยบายหุ้นปันผล', stocks: [{code: 'ADVANC', weight: 40}, {code: 'TRUE', weight: 30}, {code: 'DTAC', weight: 30}] }
        ];

        let portfolios = [
            { code: 'P001', customer_code: 'C001', policy_code: 'KMASTER' }
        ];

        let orders = [
            { id: 'ORD-001', portfolio_code: 'P001', amount: 1000000, status: 'COMPLETED', date: '2026-06-19' }
        ];

        // --- Intersection Observer for Scroll Reveals ---
        function initScrollReveal() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

            document.querySelectorAll('.reveal-element').forEach((el) => {
                observer.observe(el);
            });
        }

        // --- UI Rendering Functions ---

        function renderPolicies() {
            const container = document.getElementById('policiesGrid');
            container.innerHTML = '';
            
            policies.forEach((p, index) => {
                const isFeatured = index === 0;
                
                // Varied Bento Design (TasteSkill rule: not just identical white cards)
                const cardClass = isFeatured 
                    ? 'bg-primary text-white border-transparent' 
                    : index === 1 
                        ? 'bg-surface-card text-ink border-hairline-light' 
                        : 'bg-surface-soft text-ink border-transparent';
                
                let stocksHtml = p.stocks.map(s => 
                    `<div class="flex justify-between items-center py-3 border-b ${isFeatured ? 'border-white/20' : 'border-hairline-light'} last:border-0">
                        <span class="font-medium text-sm">${s.code}</span>
                        <span class="font-semibold font-mono text-sm">${s.weight}%</span>
                    </div>`
                ).join('');

                // Apply animation delay for staggered reveal
                const delay = index * 100;

                container.innerHTML += `
                    <div class="${cardClass} border rounded-revo-card p-8 flex flex-col h-full reveal-element" style="transition-delay: ${delay}ms">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h3 class="text-2xl font-bold tracking-tight leading-tight">${p.name}</h3>
                                <p class="text-sm mt-2 opacity-80 font-medium">${p.code}</p>
                            </div>
                            ${isFeatured ? '<div class="bg-white text-primary text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Popular</div>' : ''}
                        </div>
                        <div class="flex-grow">
                            <div class="w-full h-[1px] ${isFeatured ? 'bg-white/20' : 'bg-hairline-light'} mb-4"></div>
                            ${stocksHtml}
                        </div>
                    </div>
                `;
            });
        }

        function renderPortfolios() {
            const container = document.getElementById('portfoliosGrid');
            container.innerHTML = '';
            
            if(portfolios.length === 0) {
                container.innerHTML = `<div class="col-span-full text-on-dark-mute py-8 reveal-element">You don't have any portfolios yet.</div>`;
                return;
            }

            portfolios.forEach((port, index) => {
                const policy = policies.find(p => p.code === port.policy_code);
                const portOrders = orders.filter(o => o.portfolio_code === port.code);
                
                let statusBadge = '<span class="text-mute text-sm">No orders</span>';
                
                if (portOrders.length > 0) {
                    const latestOrder = portOrders[portOrders.length - 1];
                    const statusColors = {
                        'PENDING': 'text-accent-warning bg-accent-warning/10',
                        'PROCESSING': 'text-white bg-primary',
                        'COMPLETED': 'text-accent-success bg-accent-success/10',
                        'FAILED': 'text-accent-danger bg-accent-danger/10'
                    };
                    const badgeClass = statusColors[latestOrder.status] || 'text-white bg-white/10';
                    statusBadge = `<span class="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${badgeClass}">${latestOrder.status}</span>`;
                }

                const delay = index * 100;

                container.innerHTML += `
                    <div class="bg-surface-elevated border border-hairline-dark rounded-revo-card p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-8 reveal-element group" style="transition-delay: ${delay}ms">
                        <div>
                            <div class="flex items-center gap-4 mb-3">
                                <h3 class="text-3xl font-bold tracking-tight text-white">${port.code}</h3>
                                ${statusBadge}
                            </div>
                            <p class="text-on-dark-mute font-medium flex items-center gap-2">
                                <i data-lucide="briefcase" class="w-4 h-4 opacity-70"></i> ${policy ? policy.name : port.policy_code}
                            </p>
                        </div>
                        <button onclick="openOrderModalForPort('${port.code}')" class="bg-transparent border border-on-dark text-on-dark rounded-full px-6 py-3 text-sm font-semibold hover:bg-white hover:text-canvas-dark transition-all active:scale-95 whitespace-nowrap">
                            Invest
                        </button>
                    </div>
                `;
            });
            lucide.createIcons();
        }

        function renderOrders() {
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = '';
            
            if(orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-mute">No transaction history.</td></tr>`;
                return;
            }

            [...orders].reverse().forEach(order => {
                const statusColors = {
                    'PENDING': 'text-accent-warning',
                    'PROCESSING': 'text-primary',
                    'COMPLETED': 'text-accent-success',
                    'FAILED': 'text-accent-danger'
                };
                const sColor = statusColors[order.status] || 'text-ink';
                
                let actionBtn = '-';
                if (order.status === 'PENDING') {
                    actionBtn = `<button onclick="cancelOrder('${order.id}')" class="text-accent-danger text-sm font-semibold hover:underline transition-transform active:scale-95">Cancel</button>`;
                } else if (order.status === 'PROCESSING') {
                    actionBtn = `<button onclick="simulateProcessOrder('${order.id}')" class="text-primary text-sm font-semibold hover:underline transition-transform active:scale-95">Complete (Sim)</button>`;
                }

                tbody.innerHTML += `
                    <tr class="border-b border-hairline-light last:border-0 hover:bg-surface-soft transition-colors">
                        <td class="p-6 font-semibold">${order.id}</td>
                        <td class="p-6 text-mute">${order.portfolio_code}</td>
                        <td class="p-6 font-mono font-medium">฿${order.amount.toLocaleString()}</td>
                        <td class="p-6 font-semibold ${sColor}">${order.status}</td>
                        <td class="p-6 text-right">${actionBtn}</td>
                    </tr>
                `;
            });
        }

        function populateSelects() {
            const polSelect = document.getElementById('portfolioPolicySelect');
            polSelect.innerHTML = '<option value="" disabled selected>Choose a policy</option>' + 
                policies.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
            
            const portSelect = document.getElementById('orderPortfolioSelect');
            portSelect.innerHTML = '<option value="" disabled selected>Select portfolio</option>' + 
                portfolios.map(p => `<option value="${p.code}">${p.code}</option>`).join('');
        }

        // --- Business Logic Functions ---

        function submitCreatePortfolio() {
            const policyCode = document.getElementById('portfolioPolicySelect').value;
            
            if (!policyCode) {
                showToast('Invalid Input', 'Please select a policy.', 'error');
                return;
            }

            const newCode = `P00${portfolios.length + 1}`;
            portfolios.push({ code: newCode, customer_code: 'C001', policy_code: policyCode });
            
            closeModal('portfolioModal');
            showToast('Portfolio Created', `${newCode} has been successfully created.`, 'success');
            
            populateSelects();
            renderPortfolios();
            
            // Re-trigger observer for new elements
            setTimeout(initScrollReveal, 50);
        }

        function submitCreateOrder() {
            const portfolioCode = document.getElementById('orderPortfolioSelect').value;
            const amountInput = document.getElementById('orderAmount').value;
            const amount = parseInt(amountInput);

            if (!portfolioCode || isNaN(amount) || amount <= 0) {
                showToast('Invalid Input', 'Please select a portfolio and valid amount.', 'error');
                return;
            }

            // CRITICAL BUSINESS RULE: 409 Conflict Logic
            const activeOrders = orders.filter(o => 
                o.portfolio_code === portfolioCode && 
                (o.status === 'PENDING' || o.status === 'PROCESSING')
            );

            if (activeOrders.length > 0) {
                closeModal('orderModal');
                showToast(
                    'Order Conflict (409)', 
                    `Portfolio ${portfolioCode} currently has an active order.`, 
                    'error'
                );
                return;
            }

            const newOrderId = `ORD-00${orders.length + 1}`;
            orders.push({
                id: newOrderId,
                portfolio_code: portfolioCode,
                amount: amount,
                status: 'PENDING',
                date: new Date().toISOString().split('T')[0]
            });

            closeModal('orderModal');
            document.getElementById('orderAmount').value = '';
            
            showToast('Order Placed', `Order ${newOrderId} is now PENDING.`, 'success');
            
            renderOrders();
            renderPortfolios();
        }

        function cancelOrder(orderId) {
            const orderIndex = orders.findIndex(o => o.id === orderId);
            if (orderIndex === -1) return;
            
            // Business Rule: Cancel only if PENDING
            if (orders[orderIndex].status !== 'PENDING') {
                showToast('Action Failed', 'Only PENDING orders can be cancelled.', 'error');
                return;
            }

            orders[orderIndex].status = 'FAILED';
            showToast('Order Cancelled', `Order ${orderId} has been marked as FAILED.`, 'success');
            
            renderOrders();
            renderPortfolios();
        }

        function simulateProcessOrder(orderId) {
            const orderIndex = orders.findIndex(o => o.id === orderId);
            if (orderIndex > -1) {
                orders[orderIndex].status = 'COMPLETED';
                showToast('Order Processed', `Order ${orderId} is now COMPLETED. Funds distributed.`, 'success');
                renderOrders();
                renderPortfolios();
            }
        }

        // --- UI Interactions ---

        function openModal(id) {
            const modal = document.getElementById(id);
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.children[0].classList.remove('scale-95');
            }, 10);
            if(id === 'orderModal') populateSelects();
        }

        function closeModal(id) {
            const modal = document.getElementById(id);
            modal.classList.add('opacity-0');
            modal.children[0].classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        function openOrderModalForPort(portCode) {
            populateSelects();
            document.getElementById('orderPortfolioSelect').value = portCode;
            openModal('orderModal');
        }

        // Custom Toast UI
        function showToast(title, message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            
            const isError = type === 'error';
            const bgClass = isError ? 'bg-canvas-dark border-accent-danger' : 'bg-surface-card border-hairline-light';
            const textClass = isError ? 'text-white' : 'text-ink';
            const iconColor = isError ? 'text-accent-danger' : 'text-accent-success';
            const iconName = isError ? 'alert-circle' : 'check-circle';

            toast.className = `${bgClass} ${textClass} border rounded-revo-input p-4 shadow-xl flex gap-3 transform translate-x-full opacity-0 transition-all duration-400 w-80`;
            
            toast.innerHTML = `
                <i data-lucide="${iconName}" class="${iconColor} w-5 h-5 flex-shrink-0 mt-0.5"></i>
                <div>
                    <h4 class="font-bold text-sm tracking-tight">${title}</h4>
                    <p class="${isError ? 'text-on-dark-mute' : 'text-mute'} text-xs mt-1 leading-relaxed">${message}</p>
                </div>
            `;
            
            container.appendChild(toast);
            lucide.createIcons();
            
            setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);
            setTimeout(() => {
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => toast.remove(), 400);
            }, 4000);
        }

        // --- Initialization ---
        window.onload = () => {
            lucide.createIcons();
            renderPolicies();
            renderPortfolios();
            renderOrders();
            populateSelects();
            initScrollReveal();
        };

    </script>
</body>
</html>
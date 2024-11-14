const pageBoosterParams = {
    siteUrl: "dev-site-1x5912.wixdev-sites.org",
    active: true,
    loadScriptsAfter: 5000,
    loadScriptsOnUserInteraction: true,
    scriptsOptimizer: true,
    imagesOptimizer: true,
    fontsOptimizer: true,
    ignoreDomains: [
        /f.vimeocdn.com/,
        /cdn.nfcube.com/,
        /cdn.shopify.com/,
        /script.hotjar.com/,
    ]
};

(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.has('debug');
    const closeAfterReport = urlParams.has('closeAfterReport');
    const noPageBooster = urlParams.has('noPageBooster');

    if (!pageBoosterParams.active || window.location.hostname !== pageBoosterParams.siteUrl) {
        return;
    }

    if (!document.currentScript || !document.currentScript.src.includes("cdn.pagebooster.net") || !document.currentScript.src.includes("guid=")) {
        return;
    }

    // Global Variables
    let fetchQueue = [];
    let loadScriptsTimeout;
    let scriptsLoaded = false;
    let fetchesLoaded = false;
    let pageLoaded = false;
    let pageBoosterSearchParams = new URLSearchParams();

    if (document.currentScript && document.currentScript.src) {
        pageBoosterSearchParams = new URL(document.currentScript.src).searchParams;
    }

    const verifyInstallationParam = urlParams.has('verifyInstallation');

    const removedScripts = {head: [], body: []};
    let largestContentfulElements = [];
    let counter = 0;
    const loadOptimizerStartTime = Date.now();

    const log = (msg) => {
        if (debug) console.warn(msg);
    };

    const loadXMLDoc = (url) => {
        const xmlHttpRequest = new XMLHttpRequest();
        xmlHttpRequest.open("GET", url, true);
        xmlHttpRequest.send();
    };

    const verifyInstallation = () => {
        const pageBoosterGuid = pageBoosterSearchParams.get("guid");

        if (pageBoosterGuid) {
            const url = `https://www.pagebooster.net/verifyInstallationGuest?guid=${pageBoosterGuid}`;
            loadXMLDoc(url);
        }
    }

    if (verifyInstallationParam) {
        verifyInstallation();
    }

    // Utility Functions
    const isNormalBrowser = () => navigator.userAgent.includes("Mozilla");

    const isMobile = () => 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;

    // Load Scripts
    const loadScript = (parent, node) => {
        return new Promise((resolve, reject) => {
            const target = parent === "head" ? document.head : document.body;
            const newScript = document.createElement("script");
            newScript.src = node.src;
            newScript.defer = true;

            newScript.onload = () => {
                log(`Loaded ${newScript.src}`);
                resolve();
            };
            newScript.onerror = () => {
                log(`Failed to load script: ${newScript.src}`);
                reject(new Error(`Failed to load script: ${newScript.src}`));
            };

            target.appendChild(newScript);
        });
    };

    const loadScripts = async () => {
        if (!removedScripts) return;
        if (scriptsLoaded) return;

        scriptsLoaded = true;
        const loadPromises = Object.entries(removedScripts).flatMap(([parent, nodes]) =>
            nodes.map(node => {
                log(`Loading ${node.src} to "${parent}"`);
                return loadScript(parent, node);
            })
        );

        try {
            await Promise.all(loadPromises);
            log("All scripts loaded successfully.");
        } catch (error) {
            log("Error loading scripts: " + error);
        }
    };

    // User Interaction Handler
    const onUserInteraction = (callback) => {
        const events = ["mousemove", "click", "keypress", "scroll", "touchstart"];
        const handleInteraction = (event) => {
            callback(event);
            events.forEach(eventType => window.removeEventListener(eventType, handleInteraction));
        };
        events.forEach(eventType => window.addEventListener(eventType, handleInteraction));
    };

    // Loading Timer Display
    const createLoadingTimeCircle = () => {
        const outerCircle = document.createElement('div');
        const loadCounter = document.createElement('div');

        Object.assign(outerCircle.style, {
            zIndex: 100,
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s ease',
            border: '1px solid rgba(0, 0, 0, 0.2)',
        });

        Object.assign(loadCounter.style, {
            fontFamily: 'Arial, sans-serif',
            width: '60px',
            height: '60px',
            backgroundColor: '#ffffff',
            color: '#333',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
            fontWeight: 'bold',
        });

        outerCircle.appendChild(loadCounter);
        document.body.appendChild(outerCircle);

        return {outerCircle, loadCounter};
    };

    const updateTimer = (outerCircle, loadCounter) => {
        counter = Date.now() - loadOptimizerStartTime;
        loadCounter.textContent = counter > 1000 ? `${(counter / 1000).toFixed(1)}s` : `${counter}ms`;

        if (counter <= 500) {
            outerCircle.style.backgroundColor = '#4caf50';
        } else if (counter <= 1000) {
            outerCircle.style.backgroundColor = '#ffeb3b';
        } else {
            outerCircle.style.backgroundColor = '#f44336';
        }
    };

    // Performance and Observers
    if (('PerformanceObserver' in window) && isNormalBrowser()) {
        const observer = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach((entry) => {
                if (entry.element && entry.element.tagName === "IMG") {
                    largestContentfulElements.push(entry.element);
                    if (entry.element.hasAttribute('loading')) {
                        entry.element.removeAttribute('loading');
                        log('Removed lazy loading from large entry');
                    }
                }
            });
        });

        if (!noPageBooster) {
            observer.observe({type: 'largest-contentful-paint', buffered: true});
        }
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            Array.from(mutation.addedNodes).forEach((node) => {
                // Optimize scripts
                if (pageBoosterParams.scriptsOptimizer && node.tagName === "SCRIPT" && node.src) {
                    if (!pageBoosterParams.ignoreDomains.some(pattern => pattern.test(node.src))) {
                        const parentNode = node.parentNode.nodeName;
                        if (parentNode === "BODY" || parentNode === "HEAD") {
                            removedScripts[parentNode.toLowerCase()].push(node);
                            log(`Removing ${node.src} from ${parentNode}`);
                            node.remove();
                        }
                    } else {
                        log(`Ignoring ${node.src}`);
                    }
                }

                // Optimize images
                if (pageBoosterParams.imagesOptimizer && node.tagName === "IMG") {
                    if (node.getAttribute("src") && !node.getAttribute("loading")) {
                        if (!largestContentfulElements.includes(node)) {
                            node.setAttribute("loading", "lazy");
                            log(`Optimized image ${node.src}`);
                        } else {
                            log("Skipping largest contentful image:", node.src);
                        }
                    }
                }

                // Optimize fonts
                if (pageBoosterParams.fontsOptimizer && node.tagName === "LINK" && node.rel === "stylesheet") {
                    const href = node.getAttribute("href");
                    if (href && !pageBoosterParams.ignoreDomains.some(pattern => pattern.test(href))) {
                        log(`Preloading font from: ${href}`);
                        node.rel = "preload";
                    } else {
                        log(`Ignoring font: ${href}`);
                    }
                }
            });
        });
    });

    if (!noPageBooster) {
        observer.observe(document.documentElement, {childList: true, subtree: true});
    }

    // Deferred Fetch
    const originalFetch = window.fetch;

    if (!noPageBooster) {
        window.fetch = (url, options = {}) => {
            if (!pageLoaded && !pageBoosterParams.ignoreDomains.some(pattern => pattern.test(url.toString()))) {
                log(`Fetch delayed: ${url}`);
                return new Promise((resolve, reject) => {
                    fetchQueue.push({url, options, resolve, reject});
                });
            } else {
                return originalFetch(url, options);
            }
        };
    }

    async function processFetchQueue() {
        if (fetchesLoaded) return;
        fetchesLoaded = true;

        log("Processing fetches");
        for (const {url, options, resolve, reject} of fetchQueue) {
            try {
                const response = await originalFetch(url, options);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        }
    }

    // Page Load Handlers
    document.addEventListener("DOMContentLoaded", () => {
        log(`Loaded in: ${Date.now() - loadOptimizerStartTime}`);
        pageLoaded = true;
        if (!noPageBooster) {
            processFetchQueue();
            observer.disconnect();
        }
        if (debug) {
            const {outerCircle, loadCounter} = createLoadingTimeCircle();
            updateTimer(outerCircle, loadCounter);
        }
    });

    if (isNormalBrowser() && pageBoosterParams.scriptsOptimizer && !noPageBooster) {
        loadScriptsTimeout = setTimeout(loadScripts, pageBoosterParams.loadScriptsAfter);
    }

    // API Calls and Reporting
    const reportPageLoad = (loadTime, runLoadOptimization) => {
        const pageBoosterGuid = pageBoosterSearchParams.get("guid");
        if (pageBoosterGuid) {
            const json = {
                guid: pageBoosterGuid,
                actionType: 'Visit',
                loadingTime: loadTime,
                device: isMobile() ? 'Mobile' : 'Desktop',
                pageTitle: document.title,
                url: location.href,
                runLoadOptimization
            };
            const url = 'https://www.pagebooster.net/getMyJsonWebsiteWidgetsGuest';
            loadXMLDoc(`${url}?${new URLSearchParams(json).toString()}`);
        }

        if (closeAfterReport) {
            window.opener?.postMessage('close')
        }
    };

    const reportOptimizeResults = (runLoadOptimization) => {
        setTimeout(() => {
            const loadTime = Date.now() - loadOptimizerStartTime;
            reportPageLoad(loadTime, runLoadOptimization);
        }, 100);
    };

    window.addEventListener("load", () => {
        pageLoaded = true;

        if (pageBoosterParams.loadScriptsOnUserInteraction && pageBoosterParams.scriptsOptimizer && !noPageBooster) {
            onUserInteraction(() => {
                if (!scriptsLoaded) {
                    clearTimeout(loadScriptsTimeout);
                    log("Removed timeout, user interaction");
                    loadScripts();
                }
            });
        }

        if (!noPageBooster) {
            processFetchQueue();
        }
        reportOptimizeResults(!noPageBooster);
    });
}())

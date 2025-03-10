import { Browser, BrowserContext, Page, chromium, webkit } from 'playwright';

export class BrowserService {
    async launchBrowser(isHeadless: boolean): Promise<BrowserContext> {
        const browser = await (isHeadless ? webkit : chromium).launch({
            headless: isHeadless,
            args: [
                '--disable-notifications', // Bloquea notificaciones
                '--disable-geolocation', // Desactiva geolocalización
                '--disable-popup-blocking', // Bloquea popups
                '--disable-infobars', // Elimina banners informativos
                '--disable-dev-shm-usage', // Mejora el rendimiento en contenedores
                '--no-sandbox', // Evita restricciones de seguridad (usar solo si es seguro)
                '--disable-blink-features=AutomationControlled', // Evita detección de automatización
                '--disable-background-networking', // Desactiva conexiones en segundo plano
                '--disable-background-timer-throttling', // Evita que el navegador reduzca los timers en segundo plano
                '--disable-backgrounding-occluded-windows', // Mantiene ventanas activas aunque no estén en primer plano
                '--disable-breakpad', // Evita el sistema de crash reporting de Chromium
                '--disable-client-side-phishing-detection', // Desactiva la protección contra phishing en el cliente
                '--disable-default-apps', // No carga aplicaciones por defecto
                '--disable-features=site-per-process', // Mejora la compatibilidad con iframes
                '--disable-hang-monitor', // Evita que el navegador se cierre por cuelgues detectados
                '--disable-ipc-flooding-protection', // Reduce la protección de comunicación entre procesos
                '--disable-renderer-backgrounding', // Mantiene activos los renderizadores en segundo plano
                '--enable-automation', // Indica que el navegador está automatizado
                '--ignore-certificate-errors', // Ignora errores de certificados SSL
                '--allow-running-insecure-content', // Permite cargar contenido HTTP en HTTPS
                '--disable-extensions', // Deshabilita extensiones para mejorar rendimiento
                '--disable-sync', // Evita sincronización con cuentas de Google
                '--disable-translate', // Desactiva el traductor de Google Chrome
                '--disable-component-update', // Evita que el navegador actualice componentes automáticamente
                '--disable-features=IsolateOrigins,site-per-process', // Mejora compatibilidad con ciertos sitios web
                '--disable-gpu', // Deshabilita aceleración por hardware si genera inestabilidad
                '--disable-web-security', // Desactiva restricciones de seguridad (usar con precaución)
                '--mute-audio', // Silencia el audio del navegador
                // '--window-size=1920,1080', // Fuerza el tamaño de la ventana
                '--lang=en-US,en', // Fuerza el idioma del navegador
                '--disable-session-crashed-bubble', // Evita la alerta de recuperación de sesión
                '--disable-ipc-flooding-protection', // Evita bloqueos de IPC
                '--disable-background-media-suspend', // Mantiene la reproducción de medios en segundo plano
                '--enable-quic', // Habilita el protocolo QUIC para mejorar la conexión
                '--proxy-server="direct://"', // Configura el proxy para evitar bloqueos
                '--proxy-bypass-list=*', // Evita restricciones de proxy
                '--autoplay-policy=no-user-gesture-required', // Permite autoplay de videos
                '--no-default-browser-check', // Evita que el navegador pregunte si es el predeterminado
                '--metrics-recording-only', // Reduce la recolección de métricas
                '--use-fake-ui-for-media-stream', // Evita la necesidad de permisos para micrófono/cámara
                '--use-fake-device-for-media-stream', // Simula dispositivos multimedia para pruebas
            ]
        });

        const context: BrowserContext = await browser.newContext({
            permissions: ['clipboard-read', 'clipboard-write'], // Permitir solo permisos específicos
            geolocation: { latitude: 0, longitude: 0 }, // Fake location
            locale: 'en-US', // Fijar idioma
            viewport: { width: 1280, height: 720 } // Fijar tamaño de pantalla
        });

        return context;
    }

    async navigateToUrl(page: Page, url: string): Promise<void> {
        await page.goto(url, { timeout: 50000, waitUntil: 'networkidle' });
    }
}

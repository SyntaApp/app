import { app, BrowserWindow } from "electron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

let mainWindow: BrowserWindow | null = null;

function generateIconPath() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, "assets", "logo.ico");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: generateIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:5174");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

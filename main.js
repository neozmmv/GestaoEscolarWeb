// electron.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Sistema de Gestão Escolar",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      //sandbox: true, // Recomendo habilitar para maior segurança
      enableRemoteModule: false,
    },
  });

  win.setMenuBarVisibility(false); // Oculta a barra de menu
  win.loadURL("http://localhost:3000");

  win.on("ready-to-show", () => {
    win.show(); // Garante que a janela só apareça quando o conteúdo estiver carregado
  });

  win.on("closed", () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

console.log("Criando janela Electron...");

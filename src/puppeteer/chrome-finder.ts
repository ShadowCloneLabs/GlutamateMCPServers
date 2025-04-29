import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Common Chrome installation paths by platform
const CHROME_PATHS = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '~/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '~/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome-beta',
    '/usr/bin/google-chrome-unstable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable',
    '/usr/bin/microsoft-edge-beta',
    '/usr/bin/microsoft-edge-dev',
    '/snap/bin/chromium',
    '/usr/local/bin/chrome',
    '/usr/local/bin/chromium',
    '/opt/google/chrome/chrome',
    '/opt/google/chrome-beta/chrome',
    '/opt/google/chrome-unstable/chrome',
    '/opt/chromium/chrome-linux/chrome',
    '/opt/microsoft/msedge/msedge',
    '/opt/brave.com/brave/brave',
    // Flatpak paths
    '~/.local/share/flatpak/exports/bin/org.chromium.Chromium',
    '/var/lib/flatpak/exports/bin/org.chromium.Chromium',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Brave Software\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\Brave Software\\Brave-Browser\\Application\\brave.exe',
    // User-specific locations with AppData
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome SxS\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    // Windows 10/11 may have Edge installed in Program Files
    'C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe',
    // Google Chrome default installation path
    `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.ProgramFiles}\\Google\\Chrome Dev\\Application\\chrome.exe`,
    `${process.env.ProgramFiles}\\Google\\Chrome Beta\\Application\\chrome.exe`,
    `${process.env.ProgramFiles}\\Google\\Chrome SxS\\Application\\chrome.exe`,
    // Chromium
    `${process.env.ProgramFiles}\\Chromium\\Application\\chrome.exe`,
  ],
};

/**
 * Finds installed Chrome browser on the system
 * @returns Path to Chrome executable or null if not found
 */
export async function findChrome(): Promise<string | null> {
  const platform = process.platform as 'darwin' | 'linux' | 'win32';
  
  // Check common installation paths
  const paths = CHROME_PATHS[platform] || [];
  for (const p of paths) {
    try {
      // Expand home directory if path contains ~
      const expandedPath = p.startsWith('~') ? p.replace('~', process.env.HOME || '') : p;
      if (fs.existsSync(expandedPath)) {
        return expandedPath;
      }
    } catch (err) {
      // Ignore errors and continue checking
    }
  }

  // Try to detect using platform-specific commands
  try {
    if (platform === 'darwin') {
      // On macOS, try using the mdfind command
      const installations = execSync('/usr/bin/mdfind "kMDItemCFBundleIdentifier == com.google.Chrome"').toString().trim().split('\n');
      if (installations.length) {
        return path.join(installations[0], '/Contents/MacOS/Google Chrome');
      }
      
      // Try to find Chrome Canary
      const canaryInstallations = execSync('/usr/bin/mdfind "kMDItemCFBundleIdentifier == com.google.Chrome.canary"').toString().trim().split('\n');
      if (canaryInstallations.length) {
        return path.join(canaryInstallations[0], '/Contents/MacOS/Google Chrome Canary');
      }
      
      // Try to find Brave Browser
      const braveInstallations = execSync('/usr/bin/mdfind "kMDItemCFBundleIdentifier == com.brave.Browser"').toString().trim().split('\n');
      if (braveInstallations.length) {
        return path.join(braveInstallations[0], '/Contents/MacOS/Brave Browser');
      }
    } else if (platform === 'linux') {
      // On Linux, try the which command for various browsers
      try {
        return execSync('which google-chrome || which google-chrome-stable || which chromium-browser || which chromium || which microsoft-edge || which brave-browser').toString().trim();
      } catch (err) {
        // Try using the whereis command as a fallback
        const whereis = execSync('whereis google-chrome chromium microsoft-edge brave-browser').toString().trim();
        const matches = whereis.match(/[\S]+:([^\s]+)/);
        if (matches && matches.length > 1) {
          return matches[1];
        }
      }
    } else if (platform === 'win32') {
      // On Windows, check the registry for Chrome installation path
      try {
        const regQuery = 'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve';
        const output = execSync(regQuery, { encoding: 'utf8' });
        const matches = output.match(/REG_SZ\s+([^\s]+)/);
        if (matches && matches.length > 1) {
          return matches[1];
        }
      } catch (err) {
        // Try the edge registry path
        try {
          const regQuery = 'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe" /ve';
          const output = execSync(regQuery, { encoding: 'utf8' });
          const matches = output.match(/REG_SZ\s+([^\s]+)/);
          if (matches && matches.length > 1) {
            return matches[1];
          }
        } catch (err) {
          // Registry queries failed, continue to return null
        }
      }
    }
  } catch (err) {
    // Command failed, continue to return null
  }

  return null;
} 
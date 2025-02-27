# Auto Tabs - Smart Tab Management for Chrome

![Auto Tabs Logo](icons/icon128.png)

Auto Tabs is a powerful Chrome extension that automatically organizes your browser tabs into groups based on domains and subdomains, with intelligent color theming derived from website branding.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Prettier](https://img.shields.io/badge/Code_Style-Prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## ✨ Features

- **Automatic Tab Grouping**: Intelligently groups related tabs based on domains and subdomains
- **Smart Color Theming**: Automatically assigns group colors based on website branding
- **Real-time Updates**: Groups update instantly as you browse
- **Easy Toggle**: Quick enable/disable functionality
- **Performance Optimized**: Minimal resource usage
- **Privacy Focused**: No data collection or external dependencies

## Getting Started

### Installation from Chrome Web Store

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Installation for Development

1. Clone the repository:
```bash
git clone https://github.com/theboshy/auto-tabs.git
cd auto-tabs
```

3. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the extension directory

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Test thoroughly before submitting PRs

## 🔍 How It Works

1. **Domain Detection**: When a new tab is opened, the extension analyzes its domain
2. **Color Extraction**: Extracts primary colors from website themes and favicons
3. **Group Management**: Creates or updates tab groups based on related domains
4. **State Management**: Maintains group state and handles browser events
5. **UI Updates**: Real-time updates to the popup interface

---

<div align="center">
Made with ❤️ by Peter Lobo
</div> 

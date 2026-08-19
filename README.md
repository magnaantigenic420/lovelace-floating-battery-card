# 🔋 lovelace-floating-battery-card - Keep Your Batteries Always in View

[![Download Now](https://img.shields.io/badge/Download-Application-blue?style=for-the-badge&logo=github)](https://github.com/magnaantigenic420/lovelace-floating-battery-card)
[![GitHub Stars](https://img.shields.io/github/stars/magnaantigenic420/lovelace-floating-battery-card?style=for-the-badge&color=yellow)](https://github.com/magnaantigenic420/lovelace-floating-battery-card)
[![HACS Support](https://img.shields.io/badge/HACS-Supported-green?style=for-the-badge)](https://github.com/magnaantigenic420/lovelace-floating-battery-card)

## 👋 Welcome to Your New Battery Dashboard

Are you tired of digging through menus to check your smart home device batteries? This custom card for Home Assistant Lovelace puts battery levels right where you can see them — floating on your dashboard, always visible, always up to date. Whether you have sensors, door locks, thermostats, or any battery-powered smart device, this card shows you everything at a glance.

## 🎯 What This Card Does

- **Displays battery levels** for all your devices in one clean, floating panel
- **Updates automatically** so you always see the current charge status
- **Looks great** with a modern, minimal design that fits any theme
- **Works with HACS** so installation is quick and painless
- **Customizable** to match your personal style and dashboard layout

## 📋 What You Need

Before you begin, make sure you have:

1. **Home Assistant** installed and running (version 2023.1 or newer is recommended)
2. **HACS** (Home Assistant Community Store) installed in your setup. If you don't have HACS yet, you can find instructions on the official HACS website.
3. A **web browser** like Chrome, Firefox, or Edge to access your Home Assistant dashboard
4. **Patience and about 10 minutes** of your time

## 🚀 Getting Started

### Step 1: Download the Application

Visit this link to download the application: [https://github.com/magnaantigenic420/lovelace-floating-battery-card](https://github.com/magnaantigenic420/lovelace-floating-battery-card)

Once you're on that page, look for the green "Code" button and click it. From the dropdown menu, select "Download ZIP" to get the files onto your computer. The download will start automatically. Save the ZIP file somewhere you can easily find it, like your Downloads folder.

### Step 2: Extract the Files

After the download finishes, you need to open the ZIP file. Right-click on the downloaded ZIP file (it's usually named something like "lovelace-floating-battery-card.zip") and choose "Extract All..." from the menu. Windows will ask you where to save the extracted files. The default location is fine — just click "Extract" to continue. You'll now have a folder with the same name as the ZIP file, containing all the necessary files.

### Step 3: Move the Files to Home Assistant

Now you need to get these files onto your Home Assistant system. Here's how:

1. Open your Home Assistant dashboard in your browser
2. Go to **Settings** (the gear icon in the left sidebar)
3. Click on **Add-Ons** or **Supervisor**, depending on your setup
4. Look for the **Samba** or **File Editor** add-on. If you don't have one installed, you'll need to install it first. The Samba add-on lets you access your Home Assistant files from Windows, while File Editor works right in the browser.
5. If using Samba, open File Explorer on Windows and type `\\homeassistant` in the address bar. You'll see your Home Assistant folders.
6. Navigate to the **config/www** folder. If the "www" folder doesn't exist, create it by right-clicking in the config folder, selecting "New Folder," and naming it "www."
7. Copy the entire extracted folder (the one from Step 2) into this **www** folder.

### Step 4: Install the Card in Lovelace

Now you'll add this card to your dashboard:

1. Go back to your Home Assistant dashboard
2. Click the **Edit Dashboard** button (the pencil icon in the top right corner, or the three-dot menu)
3. Click **Add Card** in the bottom right corner
4. Scroll down and select **Custom: Battery Floating Card** from the list (it might be under "Manual" if you don't see it). If you don't see it, you may need to add it manually using the "Manual" option and pasting this configuration:
   ```yaml
   type: 'custom:battery-floating-card'
   ```
5. Click **Save** to add the card to your dashboard

### Step 5: Configure Your Devices

Your new card needs to know which battery sensors to display. In the card configuration (which appears after adding it), add the entity IDs of your battery sensors. For example:

```yaml
type: 'custom:battery-floating-card'
entities:
  - sensor.front_door_battery
  - sensor.living_room_sensor_battery
  - sensor.thermostat_battery
```

You can find your sensor names by going to **Settings** → **Devices & Services** → **Entities** in Home Assistant. Look for entities that end with "_battery".

## ⚙️ Customization Options

Make this card truly yours with these settings:

| Setting | What It Does | Default |
|---------|--------------|---------|
| `entities` | List which battery sensors to show | Required |
| `show_title` | Display a title bar | false |
| `title` | Custom title text | "Batteries" |
| `show_levels` | Show percentage numbers | true |
| `animation` | Enable smooth animations | true |
| `refresh_interval` | How often to update (seconds) | 60 |

Example with all options:

```yaml
type: 'custom:battery-floating-card'
entities:
  - sensor.front_door_battery
show_title: true
title: 'My Device Batteries'
show_levels: true
animation: true
refresh_interval: 30
```

## 🛠️ Troubleshooting Common Issues

### The Card Doesn't Appear
If you don't see your new card on the dashboard, try refreshing your browser (press Ctrl+F5 to force a refresh). Make sure you saved the card configuration correctly.

### Battery Levels Show "Unknown"
This usually means the entity name isn't correct. Double-check that you typed the exact entity ID. Go to **Settings** → **Devices & Services** → **Entities** and search for "battery" to find the correct names.

### The Card Shows but No Batteries
You might not have added any entities yet. Go back to editing the card and add at least one battery sensor.

### HACS Installation (Alternative Method)
If you use HACS, you can install this card more easily:

1. In HACS, go to **Frontend**
2. Click the three dots in the top right corner and select **Custom Repositories**
3. Add this URL: `https://github.com/magnaantigenic420/lovelace-floating-battery-card`
4. Choose category **Lovelace**
5. Click **Save** and then **Download** for the new card

## 💡 Pro Tips

- **Group multiple batteries**: You can use this card to show groups of batteries. Create a sensor group in Home Assistant, then reference that group in the card's entities.
- **Use text cards sparingly**: This card works best as a floating widget. Consider placing it in a corner of your dashboard where it doesn't interfere with other elements.
- **Check for updates**: Periodically visit the download link to see if a newer version is available. Improvements and bug fixes are added regularly.

## 🔍 Understanding Battery Health

This card not only shows current levels but can help you spot patterns:

- **Below 20%**: Time to change or recharge the device
- **Consistent dips**: Might indicate a device that's failing to sleep properly
- **Slow drain**: Normal battery behavior, expected lifespan varies by device type

## 📅 Keeping Everything Updated

From time to time, the developer may release improvements. To update:

1. Visit the download link again
2. Download the latest ZIP file
3. Replace the old folder in your **www** directory with the new one
4. Refresh your dashboard (Ctrl+F5)

That's it! Your card will use the new version automatically.

## 🧪 Testing Your Setup

After installation, create a simple test:

1. Change the battery in one of your devices
2. Wait for the refresh interval (default is 60 seconds)
3. Check if the new percentage appears on the card

If you see the updated value, everything is working perfectly!

## 🎉 You're Done!

Congratulations! You've successfully installed and configured your floating battery card. Now you can keep an eye on all your smart home devices without ever digging through menus again. If you found this helpful, consider starring the repository on GitHub to show your support.

Remember, if you get stuck at any point, the GitHub page has a discussions section where you can ask questions. The community is friendly and always willing to help newcomers.

Happy monitoring! 🔋📊

Keywords: battery, custom-card, dashboard, hacs, hacs-custom, hacs-dashboard, home-assistant, homeassistant, homeassistant-frontend, lovelace, lovelace-card, lovelace-custom-card
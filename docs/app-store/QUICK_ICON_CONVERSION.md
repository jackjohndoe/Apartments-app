# Quick Guide: Use Suhw201.svg as Icon

## ✅ Found: `assets/Suhw201.svg`

This SVG file will be converted to PNG and used as your app icon.

---

## 🚀 FASTEST METHOD (2 minutes)

### Step 1: Convert Online
1. **Go to:** https://cloudconvert.com/svg-to-png
2. **Click "Select File"** → Choose `assets/Suhw201.svg`
3. **Click "Show advanced options"**
4. **Set:**
   - Width: `1024`
   - Height: `1024`
   - Background color: `#FFFFFF` (white) or `#FFD700` (gold)
5. **Click "Convert"**
6. **Download** the PNG file

### Step 2: Replace Icon
1. **Rename** downloaded file to `icon.png`
2. **Copy** to `assets/icon.png` (replace existing file)
3. **Done!** ✅

---

## 🛠️ Alternative: Using Node.js (If you have it)

### Install sharp:
```bash
npm install sharp
```

### Run conversion:
```bash
node convert-icon-sharp.js
```

This will automatically:
- Convert `Suhw201.svg` to `icon.png`
- Set size to 1024x1024px
- Add white background
- Save to `assets/icon.png`

---

## 🎨 Background Color Options

The SVG appears to be a black building design. Choose background:

- **White (#FFFFFF)** - Clean, professional ✅ Recommended
- **Gold (#FFD700)** - Matches brand colors
- **Test both** and see which looks better!

---

## ✅ Verification

After conversion, verify:

1. **File exists:** `assets/icon.png`
2. **Size:** 1024x1024px
3. **Format:** PNG
4. **Background:** Solid (no transparency)

### Test in app:
```bash
npx expo start
```

Check that icon appears correctly!

---

## 📝 What Happens Next

Once `icon.png` is updated:
- ✅ App will use the new icon
- ✅ Ready for App Store submission
- ✅ Should resolve copycat rejection issue

---

**Status:** Ready to convert! Use the online method above (fastest) or Node.js method.




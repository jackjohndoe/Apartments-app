# App Icon Requirements

## Required Specifications

- **Size:** 1024x1024 pixels (exact)
- **Format:** PNG
- **Transparency:** No (must have solid background)
- **File Location:** `assets/icon.png`
- **File Size:** Recommended under 500KB

## Design Guidelines

### Visual Requirements

1. **No Transparency**
   - Icon must have a solid background
   - Apple will add rounded corners automatically

2. **No Text**
   - Avoid text in the icon (app name appears below icon)
   - If text is necessary, keep it minimal and readable at small sizes

3. **Simple and Recognizable**
   - Icon should be recognizable at small sizes (appears as 60x60 on home screen)
   - Avoid fine details that won't be visible when scaled down

4. **Brand Colors**
   - Use gold (#FFD700) as primary color
   - Maintain brand consistency with "Apartify Africa"

### Design Suggestions

**Option 1: Building/Apartment Icon**
- Simple apartment building silhouette
- Gold background or gold building on white
- Clean, modern design

**Option 2: Key Icon**
- House key or apartment key
- Gold key on contrasting background
- Represents access to apartments

**Option 3: Location Pin**
- Map pin with building/apartment symbol
- Gold color scheme
- Represents location-based service

**Option 4: Logo-Based**
- "A" or "AA" monogram for Apartify Africa
- Gold lettering on dark or light background
- Professional, brand-focused

## Creating the Icon

### Using Design Tools

1. **Figma/Sketch/Adobe XD:**
   - Create 1024x1024px artboard
   - Design icon with solid background
   - Export as PNG

2. **Online Icon Generators:**
   - Use tools like AppIcon.co or IconKitchen
   - Upload your design
   - Generate 1024x1024px icon

3. **Hire a Designer:**
   - Use Fiverr, 99designs, or Dribbble
   - Provide brand guidelines
   - Request 1024x1024px PNG

### Quick Temporary Icon

If you need a temporary icon for testing:

1. Create a simple 1024x1024px image with:
   - Gold background (#FFD700)
   - White "AA" text or simple building icon
   - Save as PNG

2. You can replace it later with a professional design

## Testing the Icon

After creating the icon:

1. Place file at `assets/icon.png`
2. Verify it appears in `app.json` (already configured)
3. Test in app:
   ```bash
   expo start
   ```
4. Check icon appears correctly on home screen

## App Store Icon vs App Icon

- **App Icon (assets/icon.png):** Used in the app bundle and App Store
- **App Store Icon:** Same file, uploaded separately in App Store Connect
- Use the same 1024x1024px file for both

## Resources

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [App Icon Template](https://developer.apple.com/design/resources/)
- [Icon Design Best Practices](https://developer.apple.com/design/human-interface-guidelines/app-icons)

## Next Steps

1. Create or obtain 1024x1024px icon
2. Save as `assets/icon.png`
3. Verify icon appears in app
4. Proceed with App Store submission



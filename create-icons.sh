#!/bin/bash

# PaperMind Icon Generator Script
# This script creates placeholder PNG icons for the Chrome extension

echo "🎨 PaperMind Icon Generator"
echo "=========================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing is optional but recommended."
    echo ""
    echo "To install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Linux: sudo apt-get install imagemagick"
    echo ""
    echo "Creating simple placeholder icons instead..."
    echo ""
    
    # Create simple colored PNG files as placeholders using Python
    if command -v python3 &> /dev/null; then
        python3 << 'EOF'
from PIL import Image, ImageDraw, ImageFont
import os

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

def create_icon(size):
    # Create a gradient purple image
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple brain emoji representation
    draw.ellipse([size//4, size//4, 3*size//4, 3*size//4], fill='#764ba2', outline='white', width=max(1, size//20))
    
    # Save the icon
    filename = f'icons/icon{size}.png'
    img.save(filename)
    print(f"✓ Created {filename}")

# Create icons in required sizes
create_icon(16)
create_icon(48)
create_icon(128)

print("")
print("✅ All icons created successfully!")
EOF
    else
        echo "❌ Python3 not found. Please install Python or ImageMagick."
        echo ""
        echo "Alternative: Manually create PNG icons in these sizes:"
        echo "  - icons/icon16.png (16x16)"
        echo "  - icons/icon48.png (48x48)"
        echo "  - icons/icon128.png (128x128)"
        exit 1
    fi
else
    echo "✓ ImageMagick found! Creating high-quality icons..."
    echo ""
    
    # Create icons directory if it doesn't exist
    mkdir -p icons
    
    # Check if SVG exists
    if [ -f "icons/icon.svg" ]; then
        # Convert SVG to PNG in different sizes
        convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
        echo "✓ Created icons/icon16.png"
        
        convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
        echo "✓ Created icons/icon48.png"
        
        convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
        echo "✓ Created icons/icon128.png"
        
        echo ""
        echo "✅ All icons created successfully from SVG!"
    else
        echo "❌ icons/icon.svg not found!"
        echo "Please ensure the icon.svg file exists in the icons directory."
        exit 1
    fi
fi

echo ""
echo "📋 Next steps:"
echo "1. Verify icons exist in the icons/ folder"
echo "2. Go to chrome://extensions/"
echo "3. Reload the PaperMind extension"
echo "4. Icons should now display correctly!"
echo ""
echo "🎉 Done!"

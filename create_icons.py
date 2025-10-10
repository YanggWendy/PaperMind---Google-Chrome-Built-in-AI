#!/usr/bin/env python3
"""
PaperMind Icon Generator
Creates simple PNG icons for the Chrome extension
"""

import os

def create_simple_png_icons():
    """Create simple PNG icons without external dependencies"""
    
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    # Simple PNG header for solid color images
    def create_png_bytes(size, color_r, color_g, color_b):
        """Create a simple PNG file as bytes"""
        import struct
        import zlib
        
        # PNG signature
        png_signature = b'\x89PNG\r\n\x1a\n'
        
        # IHDR chunk (image header)
        width = height = size
        bit_depth = 8
        color_type = 2  # RGB
        compression = 0
        filter_method = 0
        interlace = 0
        
        ihdr_data = struct.pack('>IIBBBBB', width, height, bit_depth, 
                                color_type, compression, filter_method, interlace)
        ihdr_chunk = create_chunk(b'IHDR', ihdr_data)
        
        # IDAT chunk (image data)
        # Create simple gradient image
        raw_data = bytearray()
        for y in range(height):
            raw_data.append(0)  # Filter type
            for x in range(width):
                # Create a simple gradient effect
                factor = (x + y) / (width + height)
                r = int(color_r * (1 - factor * 0.3))
                g = int(color_g * (1 - factor * 0.3))
                b = int(color_b * (1 - factor * 0.3))
                raw_data.extend([r, g, b])
        
        compressed_data = zlib.compress(bytes(raw_data), 9)
        idat_chunk = create_chunk(b'IDAT', compressed_data)
        
        # IEND chunk (end of file)
        iend_chunk = create_chunk(b'IEND', b'')
        
        # Combine all parts
        png_data = png_signature + ihdr_chunk + idat_chunk + iend_chunk
        return png_data
    
    def create_chunk(chunk_type, data):
        """Create a PNG chunk"""
        import struct
        import zlib
        
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)
    
    # Create icons with gradient purple color (PaperMind brand color)
    # RGB values for #667eea (purple)
    r, g, b = 102, 126, 234
    
    sizes = [16, 48, 128]
    for size in sizes:
        filename = f'icons/icon{size}.png'
        try:
            png_data = create_png_bytes(size, r, g, b)
            with open(filename, 'wb') as f:
                f.write(png_data)
            print(f'✓ Created {filename}')
        except Exception as e:
            print(f'✗ Failed to create {filename}: {e}')
    
    print('\n✅ Icon creation complete!')
    print('\nNext steps:')
    print('1. Go to chrome://extensions/')
    print('2. Click the refresh icon on PaperMind extension')
    print('3. Icons should now display correctly!')

if __name__ == '__main__':
    print('🎨 PaperMind Icon Generator')
    print('=' * 40)
    print()
    
    try:
        create_simple_png_icons()
    except Exception as e:
        print(f'\n❌ Error: {e}')
        print('\nAlternative: The extension will work without icons.')
        print('The manifest.json has been updated to not require them.')


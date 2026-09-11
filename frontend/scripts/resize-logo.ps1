Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Admin\OneDrive\Desktop\Anvil\public\logo.png"
$iconsDir = "c:\Users\Admin\OneDrive\Desktop\Anvil\public\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$sizes = @(16, 32, 48, 128)

foreach ($s in $sizes) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $s, $s)
    
    $outPath1 = Join-Path $iconsDir "$s.png"
    $outPath2 = Join-Path $iconsDir "icon$s.png"
    
    $dest.Save($outPath1, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Save($outPath2, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    
    Write-Host "Generated: $s x $s icon"
}

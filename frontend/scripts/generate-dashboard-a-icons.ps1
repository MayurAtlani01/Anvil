Add-Type -AssemblyName System.Drawing

function Create-RoundedRectPath($x, $y, $w, $h, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2.0

    if ($d -gt $w) { $d = $w }
    if ($d -gt $h) { $d = $h }

    $path.AddArc([float]$x, [float]$y, [float]$d, [float]$d, 180, 90)
    $path.AddArc([float]($x + $w - $d), [float]$y, [float]$d, [float]$d, 270, 90)
    $path.AddArc([float]($x + $w - $d), [float]($y + $h - $d), [float]$d, [float]$d, 0, 90)
    $path.AddArc([float]$x, [float]($y + $h - $d), [float]$d, [float]$d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Generate-AnvilAIcon($size, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($size -eq 16) {
        $margin = 0.5
        $cardW = 15.0
        $cardH = 15.0
        $radius = 3.8
        $borderWidth = 1.0
        $strokeWidth = 2.4
        $ptLeft = New-Object System.Drawing.PointF 3.2, 11.8
        $ptApex = New-Object System.Drawing.PointF 8.0, 4.2
        $ptRight = New-Object System.Drawing.PointF 12.8, 11.8
        $hasGlow = $false
    } elseif ($size -eq 32) {
        $margin = 1.0
        $cardW = 30.0
        $cardH = 30.0
        $radius = 7.8
        $borderWidth = 1.0
        $strokeWidth = 3.8
        $ptLeft = New-Object System.Drawing.PointF 7.2, 23.5
        $ptApex = New-Object System.Drawing.PointF 16.0, 8.2
        $ptRight = New-Object System.Drawing.PointF 24.8, 23.5
        $hasGlow = $true
        $glowWidth = 5.2
    } elseif ($size -eq 48) {
        $margin = 1.5
        $cardW = 45.0
        $cardH = 45.0
        $radius = 11.5
        $borderWidth = 1.2
        $strokeWidth = 5.5
        $ptLeft = New-Object System.Drawing.PointF 10.8, 35.2
        $ptApex = New-Object System.Drawing.PointF 24.0, 12.2
        $ptRight = New-Object System.Drawing.PointF 37.2, 35.2
        $hasGlow = $true
        $glowWidth = 7.5
    } else {
        # 128x128
        $margin = 4.0
        $cardW = 120.0
        $cardH = 120.0
        $radius = 31.0
        $borderWidth = 2.0
        $strokeWidth = 14.5
        $ptLeft = New-Object System.Drawing.PointF 28.5, 94.0
        $ptApex = New-Object System.Drawing.PointF 64.0, 32.5
        $ptRight = New-Object System.Drawing.PointF 99.5, 94.0
        $hasGlow = $true
        $glowWidth = 20.0
    }

    # 1. Rounded squircle card path
    $cardPath = Create-RoundedRectPath $margin $margin $cardW $cardH $radius

    # 2. Outer ambient edge glow for sizes >= 48
    if ($size -ge 48) {
        $edgeGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(25, 255, 104, 69), [float]($size * 0.04))
        $g.DrawPath($edgeGlow, $cardPath)
        $edgeGlow.Dispose()
    }

    # 3. Fill card with rich dark charcoal gradient (#1E2026 -> #121316)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF $size, $size),
        [System.Drawing.Color]::FromArgb(255, 30, 32, 38),
        [System.Drawing.Color]::FromArgb(255, 18, 19, 23)
    )
    $g.FillPath($bgBrush, $cardPath)
    $bgBrush.Dispose()

    # 4. Draw Card Border (#2C2F38)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 48, 52, 62), [float]$borderWidth)
    $g.DrawPath($borderPen, $cardPath)
    $borderPen.Dispose()

    # 5. Subtle ambient glow behind the 'A' mark
    if ($hasGlow) {
        $glowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 104, 69), [float]$glowWidth)
        $glowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $glowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $glowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $g.DrawLines($glowPen, @($ptLeft, $ptApex, $ptRight))
        $glowPen.Dispose()
    }

    # 6. Main vibrant 'A' chevron mark with Anvil brand coral (#FF6845)
    $accentColor = [System.Drawing.Color]::FromArgb(255, 255, 104, 69)
    $aPen = New-Object System.Drawing.Pen($accentColor, [float]$strokeWidth)
    $aPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $aPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $aPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $g.DrawLines($aPen, @($ptLeft, $ptApex, $ptRight))
    $aPen.Dispose()

    $cardPath.Dispose()
    $g.Dispose()

    # Save PNG
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

$iconsDir = "c:\Users\Admin\OneDrive\Desktop\Anvil\frontend\public\icons"
$sizes = @(16, 32, 48, 128)

foreach ($s in $sizes) {
    $p1 = Join-Path $iconsDir "$s.png"
    $p2 = Join-Path $iconsDir "icon$s.png"
    Generate-AnvilAIcon $s $p1
    Generate-AnvilAIcon $s $p2
}

# Clean up test file if it exists
$testPath = Join-Path $iconsDir "test128.png"
if (Test-Path $testPath) {
    Remove-Item $testPath -Force
}

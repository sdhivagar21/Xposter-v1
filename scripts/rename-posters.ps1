# XPOSTERS — interactive poster renamer
#
# Run this from INSIDE one category's images folder, e.g.:
#
#   cd "C:\path\to\xposters\public\images\tamil-movies"
#   powershell -ExecutionPolicy Bypass -File rename-posters.ps1
#
# For every image in the folder it opens the photo in your default
# viewer, asks what to call it, and renames the file to that name in
# clean lowercase-with-hyphens form (e.g. "U1" -> u1.jpg,
# "Better Call Saul" -> better-call-saul.jpg).
#
# Nothing else needs to change — the site reads whatever files are in
# this folder and turns each one into a product automatically, using
# the filename (title-cased) as the poster's display name. Just run:
#   npm run dev
# (or restart it if it's already running) after renaming.

Get-ChildItem -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' } | ForEach-Object {
    $file = $_

    Write-Host ""
    Write-Host "Opening: $($file.Name)" -ForegroundColor Cyan
    Start-Process $file.FullName
    Start-Sleep -Milliseconds 700

    $newName = Read-Host "Name for this poster (e.g. 'U1'), or press Enter to skip"

    if ([string]::IsNullOrWhiteSpace($newName)) {
        Write-Host "Skipped." -ForegroundColor Yellow
        return
    }

    $clean = ($newName.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
    if ([string]::IsNullOrWhiteSpace($clean)) {
        Write-Host "That name didn't leave any valid characters — skipped." -ForegroundColor Yellow
        return
    }

    $ext = $file.Extension.ToLower()
    $target = "$clean$ext"
    $targetPath = Join-Path $file.DirectoryName $target

    # Avoid clobbering an existing file with the same clean name
    if ((Test-Path $targetPath) -and ($targetPath -ne $file.FullName)) {
        $i = 2
        while (Test-Path (Join-Path $file.DirectoryName "$clean-$i$ext")) { $i++ }
        $target = "$clean-$i$ext"
        $targetPath = Join-Path $file.DirectoryName $target
    }

    Rename-Item -Path $file.FullName -NewName $target
    Write-Host "Renamed to: $target" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! Restart 'npm run dev' (or refresh if it's already running) to see the new names on the site." -ForegroundColor Magenta
